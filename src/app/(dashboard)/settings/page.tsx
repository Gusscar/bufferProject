import { getStore } from "@/lib/store";
import { getAccount, getChannels, BufferError } from "@/lib/buffer";
import { SettingsForm } from "@/components/settings/SettingsForm";
import type { Account, Channel } from "@/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const store = getStore();
  const configured = Boolean(process.env.BUFFER_API_KEY) || Boolean(store.bufferApiKey);

  let account: Account | null = null;
  let channels: Channel[] = [];

  if (configured) {
    try {
      account = await getAccount();
      const organizationId = account.organizations[0]?.id;
      if (organizationId) {
        channels = await getChannels(organizationId);
      }
    } catch (err) {
      if (!(err instanceof BufferError && err.status === 401)) {
        /* mostrar estado general; el formulario prueba conexión */
      }
    }
  }

  return (
    <SettingsForm
      configured={configured}
      account={account}
      channels={channels}
      model={store.pollinationsModel}
      llmModel={store.llmModel}
    />
  );
}