import { QuotesClient } from "./quotes-client";
import { getQuotes } from "@/lib/data-service";

export default async function QuotesPage() {
  const quotesResult = await getQuotes();
  const { data: quotes, warning, source, refreshedAt } = quotesResult;

  return <QuotesClient quotes={quotes} warning={warning} source={source} refreshedAt={refreshedAt} />;
}
