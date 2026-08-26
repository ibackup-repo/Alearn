import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, Star } from "lucide-react";
import { CardButton } from "@/Component/UI/card-button";
import { cn } from "@/Library/Utility";
import { toast } from "@/Component/UI/use-toast";
import { Supported_Language, Lesson_Record } from "@/Library/Language-Types";
import { Get_Lessons_List } from "@/Library/Language-API";
import { Get_Mastery, Is_Unlocked, Lesson_ID, Subscribe_Mastery } from "@/Library/Lesson-Mastery";

const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full";
const CARD = "min-h-[64px] sm:min-h-[56px] py-3 px-3 sm:py-3.5 sm:px-4 flex items-center justify-between gap-2 text-left";

function Title_From_Slug(slug: string): string {
  return slug.split("-").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-3.5 w-3.5", n <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  );
}

interface LockableCardProps {
  title: string;
  locked: boolean;
  stars: number;
  onOpen: () => void;
}

function LockableCard({ title, locked, stars, onOpen }: LockableCardProps) {
  const [clicks, setClicks] = useState(0);

  const onClick = () => {
    if (!locked) {
      onOpen();
      return;
    }
    const next = clicks + 1;
    setClicks(next);
    if (next >= 3) {
      setClicks(0);
      toast({ title: "Unlocked" });
      onOpen();
    } else {
      toast({ title: `Locked — ${3 - next} more to bypass` });
      setTimeout(() => setClicks((c) => (c === next ? 0 : c)), 1200);
    }
  };

  return (
    <CardButton
      onClick={onClick}
      title={locked ? "Triple-click to bypass" : undefined}
      className={cn(CARD, "transition-transform sm:hover:scale-[1.02]", locked && "opacity-60")}
    >
      <span className="flex-1 font-semibold text-sm sm:text-base">{title}</span>
      {locked ? <Lock className="h-4 w-4" /> : <StarRow stars={stars} />}
    </CardButton>
  );
}

export default function Level_Page() {
  const { Lang_Name, Level_Id } = useParams<{ Lang_Name: string; Level_Id: string }>();
  const activeLang = (Lang_Name || "English") as Supported_Language;
  const navigate = useNavigate();

  const [records, setRecords] = useState<Lesson_Record[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const off = Subscribe_Mastery(() => setRecords((r) => [...r]));
    return () => off();
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Get_Lessons_List(activeLang)
      .then((data) => {
        if (!isMounted) return;
        setRecords(data);
        setError(null);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to fetch lessons.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLang]);

  const lessons = useMemo(() => {
    return records
      .filter((r) => r.level === Level_Id)
      .map((r) => ({ slug: r.slug, title: Title_From_Slug(r.slug) }));
  }, [records, Level_Id]);

  if (loading) return <div className="text-sm py-6 text-center opacity-60">Loading lessons...</div>;
  if (error) return <div className="text-sm py-6 text-center text-destructive">Error: {error}</div>;
  if (!lessons.length) return <div className="text-sm py-6 text-center opacity-60">No lessons in level {Level_Id}.</div>;

  return (
    <div className={cn(GRID, "max-w-4xl mx-auto")}>
      {lessons.map((l, i) => {
        const id = Lesson_ID(Level_Id!, l.slug);
        const prevId = i === 0 ? undefined : Lesson_ID(Level_Id!, lessons[i - 1].slug);
        const locked = !Is_Unlocked(activeLang, id, prevId);
        const mastery = Get_Mastery(activeLang, id);

        return (
          <LockableCard
            key={l.slug}
            title={l.title}
            locked={locked}
            stars={mastery.Stars}
            onOpen={() => navigate(`/Language/${activeLang}/Lesson/${Level_Id}/${l.slug}`)}
          />
        );
      })}
    </div>
  );
}