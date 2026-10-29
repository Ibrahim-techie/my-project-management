import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { displayName, initials } from "@/lib/format";

const PLACEHOLDER = "placehold.co";

export function UserAvatar({ user, className }) {
  const url = user?.avatar?.url;
  return (
    <Avatar className={cn("size-8", className)}>
      {url && !url.includes(PLACEHOLDER) && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="font-montserrat text-[11px] font-semibold">
        <span aria-hidden="true">{initials(user)}</span>
        <span className="sr-only">{displayName(user)}</span>
      </AvatarFallback>
    </Avatar>
  );
}
