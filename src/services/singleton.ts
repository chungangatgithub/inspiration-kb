import { CardService } from "./card.service";

/** Per-dataDir singleton cache to prevent duplicate DatabaseService instances
 *  sharing the same SQLite WAL file and leaking file descriptors. */
const instances = new Map<string, CardService>();

export function getCardService(dataDir: string): CardService {
  let svc = instances.get(dataDir);
  if (!svc) {
    svc = new CardService(dataDir);
    instances.set(dataDir, svc);
  }
  return svc;
}

/** Close all cached services — call on app shutdown. */
export function closeAllServices(): void {
  for (const svc of instances.values()) {
    svc.close();
  }
  instances.clear();
}
