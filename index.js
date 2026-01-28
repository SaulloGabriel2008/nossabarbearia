import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

// 🔥 Inicializa Firebase Admin
initializeApp();

/**
 * 🔔 NOTIFICAÇÃO DE NOVO AGENDAMENTO
 */
export const notifyNewBooking = onDocumentCreated(
  "agendamentos/{docId}",
  async (event) => {
    console.log("🚨 Novo agendamento:", event.params.docId);

    const db = getFirestore();
    const messaging = getMessaging();

    const agendamento = event.data.data();

    // 📅 Data e hora do agendamento (SEM UTC)
    let dataFormatada = "data não informada";

    if (agendamento?.data && agendamento?.hora) {
      const [year, month, day] = agendamento.data.split("-");
      const [hour, minute] = agendamento.hora.split(":");

      const dateObj = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );

      dataFormatada = dateObj.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    // 🔑 Tokens dos barbeiros
    const tokensSnap = await db.collection("barbeirosTokens").get();
    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);

    if (tokens.length === 0) {
      console.log("⚠️ Nenhum token encontrado (novo agendamento)");
      return;
    }

    await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: "📅 Novo agendamento",
        body: `Agendado para ${dataFormatada}`
      }
    });

    console.log("✅ Notificação de novo agendamento enviada");
  }
);

/**
 * ❌ NOTIFICAÇÃO DE CANCELAMENTO
 * Dispara uma única vez usando flag `cancelNotificationSent` com timestamp
 */
export const notifyCancelledBooking = onDocumentUpdated(
  "agendamentos/{docId}",
  async (event) => {
    console.log("🚨 Atualização de agendamento:", event.params.docId);

    const before = event.data.before.data();
    const after = event.data.after.data();
    const db = getFirestore();
    const messaging = getMessaging();

    const status = (after.status || "").toLowerCase();
    const cancelStatuses = ["cancelled", "canceled", "cancelado", "cancel"];

    // ❌ Não é cancelamento
    if (!cancelStatuses.includes(status)) return;

    // ❌ Já notificou anteriormente (usar timestamp para evitar duplicação)
    // Se o documento já tinha cancelNotificationTimestamp, não notificar novamente
    if (before && before.cancelNotificationTimestamp) {
      console.log("⚠️ Notificação já foi enviada para este cancelamento");
      return;
    }

    // 📅 Data e hora do agendamento cancelado
    let dataFormatada = "data não informada";

    if (after?.data && after?.hora) {
      const [year, month, day] = after.data.split("-");
      const [hour, minute] = after.hora.split(":");

      const dateObj = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );

      dataFormatada = dateObj.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    // 🔑 Tokens
    const tokensSnap = await db.collection("barbeirosTokens").get();
    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);

    if (tokens.length === 0) {
      console.log("⚠️ Nenhum token encontrado (cancelamento)");
      return;
    }

    // 📢 Enviar notificação
    try {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: "❌ Agendamento cancelado",
          body: `Cancelado: ${dataFormatada}`
        }
      });
      console.log("✅ Notificação de cancelamento enviada");
    } catch (error) {
      console.error("❌ Erro ao enviar notificação:", error);
    }

    // 🧠 Marcar como notificado com timestamp para evitar duplicação
    try {
      await db.collection("agendamentos")
        .doc(event.params.docId)
        .update({ 
          cancelNotificationSent: true,
          cancelNotificationTimestamp: new Date()
        });
      console.log("✅ Timestamp de notificação registrado");
    } catch (error) {
      console.error("⚠️ Erro ao atualizar timestamp:", error);
    }
  }
);
