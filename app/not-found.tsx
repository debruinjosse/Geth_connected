import { Button } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";
import messages from "@/messages/nl.json";

// This is the root not-found, so it renders outside `app/[locale]` and has no
// request locale to read. It uses the default-locale copy directly.
const copy = messages.notFound;

export default function NotFound() {
  return (
    <StatusScreen
      eyebrow={copy.eyebrow}
      title={copy.title}
      actions={
        <>
          <Button href="/" arrow>
            {copy.backHome}
          </Button>
          <Button variant="ghost" href="/cards">
            {copy.browseCards}
          </Button>
        </>
      }
    >
      {copy.copy}
    </StatusScreen>
  );
}
