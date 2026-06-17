"use server";

import { revalidatePath } from "next/cache";
import {
  adicionarCnpjMonitorado,
  removerCnpjMonitorado,
  toggleCnpjMonitorado,
} from "@/lib/db";

export async function adicionarCnpj(formData: FormData) {
  const cnpj = String(formData.get("cnpj") ?? "").replace(/\D/g, "");
  const razaoSocial = String(formData.get("razao_social") ?? "");
  if (cnpj.length !== 14) return;
  await adicionarCnpjMonitorado(cnpj, razaoSocial);
  revalidatePath("/cnpjs");
}

export async function alternarCnpj(formData: FormData) {
  const cnpj = String(formData.get("cnpj") ?? "");
  const ativo = String(formData.get("ativo")) === "1";
  await toggleCnpjMonitorado(cnpj, ativo);
  revalidatePath("/cnpjs");
}

export async function removerCnpj(formData: FormData) {
  const cnpj = String(formData.get("cnpj") ?? "");
  await removerCnpjMonitorado(cnpj);
  revalidatePath("/cnpjs");
}
