import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Supported_Language, Lesson_Record } from "@/Library/Language-Types";
import { Get_Lessons_List } from "@/Library/Language-API";
import { Lesson_ID, Record_Result } from "@/Library/Lesson-Mastery";
import { Lesson_Progress } from "@/Library/Lesson-Progress";
import { Exercise, Lesson_Complete_Screen } from "@/Component/Lesson/Types/Index";
import { Parse_Alphabet_Lesson, type Alphabet_Content_Block } from "@/Component/Parser/Language/Alphabet";

const Practice_Kinds = new Set(["multipleChoice", "matchPairs", "typeAnswer", "orderSentence"]);

function Flatten_Steps(content: Alphabet_Content_Block[]): any[] {
  return content.flatMap((block) => {
    if (block.kind === "vocab") {
      return block.entries.map((entry) => ({ kind: "vocab", ...entry }));
    }
    if (block.kind === "practice") {
      return block.activities.flatMap((activity) =>
        activity.items.map((item: any) => ({ kind: activity.kind, ...item }))
      );
    }
    return [block];
  });
}

export default function Lesson_Page() {
  const { Lang_Name, Level_Id, Lesson_Slug } = useParams<{
    Lang_Name: string;
    Level_Id: string;
    Lesson_Slug: string;
  }>();

  const activeLang = (Lang_Name || "English") as Supported_Language;
  const navigate = useNavigate();

  const [steps, setSteps] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);
  const [practiceOk, setPracticeOk] = useState(0);
  const [result, setResult] = useState<null | ReturnType<typeof Record_Result>>(null);

  const done = steps !== null && index >= steps.length;
  const id = Lesson_ID(Level_Id || "", Lesson_Slug || "");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Get_Lessons_List(activeLang)
      .then((records: Lesson_Record[]) => {
        if (!isMounted) return;
        const target = records.find((r) => r.level === Level_Id && r.slug === Lesson_Slug);
        if (!target) {
          setSteps([]);
          return;
        }

        let rawData = target.content;
        if (!rawData && target.content_json) {
          try {
            rawData = JSON.parse(target.content_json);
          } catch {
            rawData = [];
          }
        }

        const rawSteps = Array.isArray(rawData) ? rawData : rawData?.steps || [];

        if (Lesson_Slug === "The-Alphabet") {
          const parsed = Parse_Alphabet_Lesson(rawSteps);
          setSteps(Flatten_Steps(parsed.content));
        } else {
          setSteps(rawSteps);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load lesson content.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLang, Level_Id, Lesson_Slug]);

  useEffect(() => {
    if (!steps) return;
    Lesson_Progress.set({ current: Math.min(index, steps.length), total: steps.length });
    return () => Lesson_Progress.set(null);
  }, [index, steps]);

  useEffect(() => {
    if (!done || result) return;
    const accuracy = practiceTotal ? practiceOk / practiceTotal : 1;
    const perfect = practiceTotal > 0 && practiceOk === practiceTotal;
    setResult(Record_Result(activeLang, id, { perfect, Accuracy: accuracy }));
  }, [done, result, practiceOk, practiceTotal, activeLang, id]);

  if (loading) return <div className="text-sm py-6 text-center opacity-60">Loading exercise data...</div>;
  if (error) return <div className="text-sm py-6 text-center text-destructive">Error: {error}</div>;
  if (!steps?.length) return <div className="text-sm py-6 text-center opacity-60">Lesson is empty.</div>;

  if (done) {
    const accuracy = practiceTotal ? practiceOk / practiceTotal : 1;
    const perfect = practiceTotal > 0 && practiceOk === practiceTotal;
    const nextInDays = result?.nextReviewAt
      ? Math.max(1, Math.round((result.nextReviewAt - Date.now()) / 86_400_000))
      : null;

    return (
      <div className="max-w-md lg:max-w-xl mx-auto w-full">
        <Lesson_Complete_Screen
          title={(Lesson_Slug || "").replace(/-/g, " ")}
          Stars={result?.Stars ?? 0}
          Practice_Total={practiceTotal}
          Practice_Ok={practiceOk}
          Accuracy={accuracy}
          perfect={perfect}
          Next_In_Days={nextInDays}
          On_Done={() => navigate(`/Language/${activeLang}/Lesson/${Level_Id}`)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md lg:max-w-xl mx-auto w-full space-y-4">
      <Exercise
        key={index}
        step={steps[index]}
        onResult={(ok) => {
          const kind = steps[index]?.kind;
          if (Practice_Kinds.has(kind)) {
            setPracticeTotal((t) => t + 1);
            if (ok) setPracticeOk((c) => c + 1);
          }
          setIndex((i) => i + 1);
        }}
      />
    </div>
  );
}