"use server";

import { revalidatePath } from "next/cache";
import {
  criarDestinatario,
  deletarDestinatario,
  toggleDestinatario,
} from "@/lib/db";

export async function adicionarDestinatario(formData: FormData) {
  const nome = String(formData.get("nome") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return; // e-mail inválido — ignora silenciosamente (validação nativa no input)
  }
  await criarDestinatario(nome, email);
  revalidatePath("/notificacoes");
}

export async function alternarDestinatario(formData: FormData) {
  const id = Number(formData.get("id"));
  const ativo = String(formData.get("ativo")) === "1";
  await toggleDestinatario(id, ativo);
  revalidatePath("/notificacoes");
}

export async function removerDestinatario(formData: FormData) {
  const id = Number(formData.get("id"));
  await deletarDestinatario(id);
  revalidatePath("/notificacoes");
}
