import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";

const FALLBACK_ORDERS = [
  {
    id: "o1",
    code: "ORD-92837",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    total: 750000,
    subtotal: 750000,
    shippingFee: 0,
    paymentMethod: "ONLINE",
    paymentStatus: "PAID",
    orderStatus: "CONFIRMED",
    fulfillmentStatus: "READY_TO_PICK",
    shippingAddress: {
      recipientName: "Nguyễn Văn A",
      phone: "0901234567",
      line: "97 Đường số 7, KDC Trung Sơn",
      ward: "Bình Hưng",
      district: "Bình Chánh",
      province: "TP. Hồ Chí Minh",
    },
    items: [
      {
        sku: "REF-TRA-01",
        name: "Trà Đen Cổ Thụ chuyên pha trà sữa (Bao 1kg)",
        price: 150000,
        quantity: 2,
        fulfillmentType: "STANDARD",
      },
      {
        sku: "REF-LY-PP500",
        name: "Ly nhựa PP 500ml dày dặn chuyên trà sữa (Thùng 1000 cái)",
        price: 450000,
        quantity: 1,
        fulfillmentType: "STANDARD",
      },
    ],
  },
  {
    id: "o2",
    code: "ORD-12847",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    total: 1650000,
    subtotal: 1650000,
    shippingFee: 0,
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    orderStatus: "PLACED",
    fulfillmentStatus: "NONE",
    shippingAddress: {
      recipientName: "Trần Thị B",
      phone: "0918765432",
      line: "123 Nguyễn Trãi",
      ward: "Phường 2",
      district: "Quận 5",
      province: "TP. Hồ Chí Minh",
    },
    items: [
      {
        sku: "REF-BOT-SUA-01",
        name: "Bột sữa Indo Kievit Vana Blanca (Bao 25kg)",
        price: 1650000,
        quantity: 1,
        fulfillmentType: "STANDARD",
      },
    ],
  },
];

function getBackendEnv() {
  try {
    const envPath = "d:/SU26/WDU/be-wms-ecom/.env";
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const env: Record<string, string> = {};
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let value = trimmed.slice(idx + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1);
            }
            env[key] = value;
          }
        }
      }
      return env;
    }
  } catch (error) {
    console.error("Failed to read backend .env:", error);
  }
  return {};
}

function decodeJwtPayload(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString();
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT decoding failed:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const payload = decodeJwtPayload(authHeader);

  if (!payload || (payload.type !== "admin" && !(payload.roles as string[])?.includes("ECOM_MANAGER"))) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const env = getBackendEnv();
  const rawDbUrl = env.ECOM_DATABASE_URL || "mongodb://127.0.0.1:27017/ecom_db";

  // Khi dùng directConnection=true, replicaSet và authSource trong URL gây xung đột
  // → strip chúng ra trước khi kết nối.
  // Nếu URL dùng port 27018 (replica set mode) nhưng MongoDB local đang standalone ở 27017 → tự chuyển sang 27017.
  let cleanDbUrl: string;
  try {
    const urlObj = new URL(rawDbUrl.replace("localhost", "127.0.0.1"));
    urlObj.searchParams.delete("replicaSet");
    urlObj.searchParams.delete("authSource");
    // Standalone fallback: 27018 → 27017
    if (urlObj.port === "27018") {
      urlObj.port = "27017";
    }
    cleanDbUrl = urlObj.toString();
  } catch {
    cleanDbUrl = rawDbUrl.replace("localhost", "127.0.0.1").replace(":27018/", ":27017/");
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(cleanDbUrl, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      directConnection: true,
    });
    await client.connect();
    const db = client.db();
    const ordersCollection = db.collection("orders");

    if (id) {
      if (!ObjectId.isValid(id)) {
        await client.close();
        return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
      }
      const order = await ordersCollection.findOne({ _id: new ObjectId(id) });
      if (!order) {
        await client.close();
        return NextResponse.json({ message: "Order not found" }, { status: 404 });
      }
      const responseOrder = {
        id: order._id.toString(),
        ...order,
        _id: undefined,
      };
      await client.close();
      return NextResponse.json(responseOrder);
    }

    const orders = await ordersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const mappedOrders = orders.map((order) => ({
      ...order,
      id: order._id.toString(),
      _id: undefined,
    }));

    await client.close();

    if (mappedOrders.length === 0) {
      return NextResponse.json(FALLBACK_ORDERS);
    }

    return NextResponse.json(mappedOrders);
  } catch (error: any) {
    console.warn("Direct DB connection failed, using fallback data. Error:", error.message);
    if (client) {
      try {
        await client.close();
      } catch (e) {}
    }

    if (id) {
      const order = FALLBACK_ORDERS.find((o) => o.id === id);
      if (!order) {
        return NextResponse.json({ message: "Order not found" }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    return NextResponse.json(FALLBACK_ORDERS);
  }
}
