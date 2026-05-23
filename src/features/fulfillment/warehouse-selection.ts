type WarehouseAvailability = {
  warehouseId: string;
  distanceKm: number;
  availableQty: number;
};

export function selectFulfillmentWarehouse(
  warehouses: WarehouseAvailability[],
  qtyOrdered: number,
) {
  return warehouses
    .filter((warehouse) => warehouse.availableQty >= qtyOrdered)
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];
}
