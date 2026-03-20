import { Heart, User, MessageCircle } from "lucide-react";

interface ProfileLike {
  name: string;
  photo?: { getDirectURL(): string } | null;
}

interface MatchOverlayProps {
  me: ProfileLike | null;
  them: ProfileLike & { principal: unknown };
  onClose: () => void;
  onOpenChat: (principal: string) => void;
}

function Avatar({
  photoUrl,
  name,
  size = "lg",
}: {
  photoUrl: string | null;
  name?: string;
  size?: "lg" | "sm";
}) {
  const dim = size === "lg" ? "w-32 h-32" : "w-10 h-10";
  const icon = size === "lg" ? "w-12 h-12" : "w-5 h-5";
  return (
    <div
      className={`${dim} rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-white/20 flex items-center justify-center shrink-0`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User className={`${icon} text-white/60`} />
      )}
    </div>
  );
}

export function MatchOverlay({
  me,
  them,
  onClose,
  onOpenChat,
}: MatchOverlayProps) {
  const mePhotoUrl = me?.photo?.getDirectURL() ?? null;
  const themPhotoUrl = them.photo?.getDirectURL() ?? null;

  return (
    <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/90 to-[#2d1b3d]" />

      {/* Soft glow rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/[0.03] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white/[0.03] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-8 text-center gap-10 w-full max-w-sm animate-match-pop">
        {/* Profile photos with heart in the middle */}
        <div className="flex items-center gap-4">
          <Avatar photoUrl={mePhotoUrl} name={me?.name} />
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl shadow-black/20 shrink-0">
            <Heart className="w-6 h-6 text-primary" fill="currentColor" />
          </div>
          <Avatar photoUrl={themPhotoUrl} name={them.name} />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.3em]">
            It's a Match
          </p>
          <h1 className="text-white text-5xl font-bold tracking-tight leading-none font-serif italic">
            You & {them.name}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed font-sans not-italic">
            You both liked each other
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              onClose();
              onOpenChat(String(them.principal));
            }}
            className="w-full h-14 rounded-2xl bg-white text-primary text-base font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl shadow-black/20"
          >
            <MessageCircle className="w-5 h-5" />
            Send a Message
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm font-semibold transition-all"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
}
