function readOrderTotal(order: any) {
  const total = Number(order?.totalAmount ?? order?.total ?? 0);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

function formatStageAmount(amount: number) {
  if (!amount) return "";
  return ` ${new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)}`;
}

export function canPayNextOnlineStage(order: any) {
  if (!order) return false;
  if (order.status === "CANCELLED" || order.orderStatus === "CANCELLED") return false;

  const paymentStatus = order.paymentStatus;
  const paymentMethod = order.paymentMethod;
  const fulfillmentStatus = order.fulfillmentStatus;
  const hasPrintItems = Boolean(order.hasPrintItems);

  if (paymentStatus === "UNPAID") {
    return !hasPrintItems || paymentMethod === "ONLINE";
  }

  if (hasPrintItems) {
    if (paymentStatus === "DEPOSIT_PAID") {
      return paymentMethod === "ONLINE" && fulfillmentStatus === "SAMPLE_PRINTED";
    }

    if (paymentStatus === "PROGRESS_PAID") {
      return paymentMethod === "ONLINE" && fulfillmentStatus === "READY_TO_PICK";
    }

    return false;
  }

  return false;
}

export function getPaymentStageBreakdown(order: any) {
  const total = readOrderTotal(order);
  if (!total) return [];

  if (order?.hasPrintItems) {
    const stage1 = Math.round(total * 0.3);
    const stage2 = Math.round(total * 0.3);
    return [
      { label: "Đợt 1 - cọc 30%", amount: stage1, status: "UNPAID" },
      { label: "Đợt 2 - duyệt mẫu và thanh toán thêm 30%", amount: stage2, status: "DEPOSIT_PAID" },
      { label: "Đợt 3 - duyệt bản in và thanh toán còn lại 40%", amount: total - stage1 - stage2, status: "PROGRESS_PAID" },
    ];
  }

  if (order?.paymentMethod === "COD") {
    const deposit = Math.round(total * 0.5);
    return [
      { label: "Đợt 1 - cọc 50%", amount: deposit, status: "UNPAID" },
      { label: "Đợt 2 - nhận hàng 50%", amount: total - deposit, status: "DEPOSIT_PAID" },
    ];
  }

  return [
    { label: "Thanh toán online 100%", amount: total, status: "UNPAID" },
  ];
}

export function getNextPaymentStageAmount(order: any) {
  const currentStatus = order?.paymentStatus || "UNPAID";
  const nextStage = getPaymentStageBreakdown(order).find(
    (stage) => stage.status === currentStatus,
  );
  return nextStage?.amount ?? 0;
}

export function getNextPaymentButtonLabel(order: any) {
  if (!order) return "Thanh toán";
  const amountText = formatStageAmount(getNextPaymentStageAmount(order));

  if (order.paymentStatus === "UNPAID") {
    if (order.hasPrintItems) return `Thanh toán đợt 1${amountText}`;
    if (order.paymentMethod === "COD") return `Thanh toán cọc 50%${amountText}`;
    return `Thanh toán 100%${amountText}`;
  }

  if (order.paymentStatus === "DEPOSIT_PAID") {
    return order.hasPrintItems
      ? `Duyệt mẫu và thanh toán đợt 2${amountText}`
      : `Thanh toán phần còn lại${amountText}`;
  }

  if (order.paymentStatus === "PROGRESS_PAID") {
    return `Duyệt bản in và thanh toán đợt 3${amountText}`;
  }

  return "Thanh toán";
}
