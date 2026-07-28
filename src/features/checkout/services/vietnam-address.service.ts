export type VietnamWard = {
  code: number;
  name: string;
};

export type VietnamDistrict = {
  code: number;
  name: string;
  wards: VietnamWard[];
};

export type VietnamProvince = {
  code: number;
  name: string;
  districts: VietnamDistrict[];
};

let cachedProvinces: VietnamProvince[] | null = null;

export async function getVietnamAdministrativeUnits() {
  if (cachedProvinces) return cachedProvinces;

  const response = await fetch("https://provinces.open-api.vn/api/?depth=3", {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`Cannot load Vietnam administrative units: ${response.status}`);
  }

  cachedProvinces = (await response.json()) as VietnamProvince[];
  return cachedProvinces;
}
