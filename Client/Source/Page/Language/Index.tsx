import { useParams } from "react-router-dom";
import { Button } from "@/Component/UI/button";

export default function Levels_Page() {
  const { Lang_Name } = useParams<{ Lang_Name: string }>();
  const activeLang = Lang_Name || "English";

  return (
    <div className="px-8 py-4 w-full relative z-[60] max-w-8xl mx-auto">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        <Button
          Label="Lesson"
          NavigateTo={`/Language/${activeLang}/Lesson`}
          Height={64}
          Color="#000000"
          TextColor="#ffffff"
        />
        <Button
          Label="Dictionary"
          NavigateTo={`/Language/${activeLang}/Dictionary`}
          Height={64}
          Color="#000000"
          TextColor="#ffffff"
        />
      </div>
    </div>
  );
}