import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { Customer, Order } from "../../customers";
import { ObjectId } from "mongodb";
import NextCors from "nextjs-cors";

type Return = {
  customers: Customer[];
};

export const getCustomers = async (): Promise<Customer[]> => {
  const mongoclient = await clientPromise;
  const data = (await mongoclient
    .db()
    .collection("customers")
    .find()
    .toArray()) as Customer[];

  return JSON.parse(JSON.stringify(data));
};

export const addCustomer = async (customer: Customer): Promise<ObjectId> => {
  const mongoclient = await clientPromise;

  const response = await mongoclient
    .db()
    .collection("customers")
    .insertOne(customer);

  return response.insertedId;
};

export const apiCustomers = async (
  req: NextApiRequest,
  res: NextApiResponse<Return | ObjectId | { error: string }>
) => {
  await NextCors(req, res, {
    methods: ["GET", "POST"],
    origin: ["http://localhost:3001"],
    optionsSuccessStatus: 200,
  });

  if (req.method === "GET") {
    const data = await getCustomers();
    res.status(200).json({ customers: data });
  } else if (req.method === "POST") {
    if (req.body.name && req.body.industry) {
      const customer: Customer = {
        name: req.body.name,
        industry: req.body.industry,
        orders: req.body.orders.map((order: Order) => {
          return { ...order, _id: new ObjectId() };
        }),
      };
      console.log(req.body);
      const insertedId = await addCustomer(customer);
      res.revalidate("/customers");
      res.revalidate("/customers/" + insertedId);
      res.status(200).json(insertedId);
    } else {
      res.status(400).json({ error: "name and industry are required." });
    }
  }
};
export default apiCustomers;
