import {
  QueryWrapper,
  string,
  date,
  QueryBuilder,
  and,
} from "@cipherstash/stashjs-worker";

import { HandlerError } from "./utils";

import z from "zod";

function dateString() {
  return z.preprocess((x): Date | undefined => {
    if (typeof x === "string") {
      const date = new Date(x);

      if (!isNaN(Number(date))) {
        return date;
      }
    }

    return undefined;
  }, z.date());
}

export const PatientRecord = z.object({
  name: z.string(),
  dob: dateString(),
  phone: z.string(),
  gender: z.string(),
  socialSecurityNumber: z.string(),
  medicalConditions: z.string(),
  comments: z.string(),
});

export const PatientRecordQuery = z
  .object({
    // Match or exact
    name: z.object({
      op: z.union([z.literal("match"), z.literal("eq")]),
      value: z.string(),
    }),

    // Fuzzy search through all fields using a field dynamic match
    fuzzy: z.string(),

    // Perform range queries on the date of birth
    dob: z.union([
      z.object({
        op: z.union([
          z.literal("eq"),
          z.literal("gt"),
          z.literal("gte"),
          z.literal("lt"),
          z.literal("lte"),
        ]),
        value: dateString(),
      }),

      z.object({
        op: z.literal("between"),
        min: dateString(),
        max: dateString(),
      }),
    ]),

    limit: z.number(),
    offset: z.number(),

    // Order by certain fields
    ordering: z.object({
      orderBy: z.union([z.literal("name"), z.literal("dob")]),
      direction: z.union([z.literal("asc"), z.literal("desc")]),
    }),
  })
  .partial();

type PatientRecordQuery = typeof PatientRecordQuery._type;

export function decodeQuery(
  query: PatientRecordQuery,
  builder: QueryBuilder
): QueryWrapper {
  const conditions: QueryWrapper[] = [];

  if (query.fuzzy) {
    conditions.push(builder.fuzzy.match(query.fuzzy));
  }

  if (query.name) {
    if (query.name.op === "eq") {
      conditions.push(builder.exactName.eq(string(query.name.value)));
    } else {
      conditions.push(builder.nameMatch.match(query.name.value));
    }
  }

  if (query.dob) {
    if (query.dob.op === "between") {
      conditions.push(
        builder.dob.between(date(query.dob.min), date(query.dob.min))
      );
    } else {
      conditions.push(builder.dob[query.dob.op](date(query.dob.value)));
    }
  }

  if (conditions.length === 0) {
    throw new HandlerError("Query contained no constraints", 400);
  } else if (conditions.length === 1) {
    return conditions[0];
  } else {
    return and(...conditions);
  }
}
