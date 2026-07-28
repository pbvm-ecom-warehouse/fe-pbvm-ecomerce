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
      return paymentMethod === "ONLINE" && fulfillmentStatus === "AWAITING_PRINT";
    }

    if (paymentStatus === "PROGRESS_PAID") {
      return paymentMethod === "ONLINE" && fulfillmentStatus === "READY_TO_PICK";
    }

    return false;
  }

  return false;
}

export function getNextPaymentButtonLabel(order: any) {
  if (!order) return "Thanh toán";
  if (order.paymentStatus === "UNPAID") {
    if (order.hasPrintItems) return "Thanh toán đợt 1";
    if (order.paymentMethod === "COD") return "Thanh toán cọc 50%";
    return "Thanh toán 100%";
  }
  if (order.paymentStatus === "DEPOSIT_PAID") {
    return order.hasPrintItems ? "Thanh toán đợt 2" : "Thanh toán phần còn lại";
  }
  if (order.paymentStatus === "PROGRESS_PAID") return "Thanh toán phần còn lại";
  return "Thanh toán";
}
