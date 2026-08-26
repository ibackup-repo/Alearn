import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/Component/UI/sonner";
import { Toaster } from "@/Component/UI/toaster";
import { TooltipProvider } from "@/Component/UI/tooltip";
import { App_Provider } from "@/Context/App";
import { Layout } from "@/Component/Layout/Index";

// Main Pages
import Auth_Page from "@/Page/Authorization";
import Not_Found from "@/Page/Not-Found";
import Root_Picker from "@/Page/Root";

// Chess Modular Views
import Chess_Index from "@/Page/Chess/Index";
import { Chess_Play_View } from "@/Page/Chess/Play";
import { Chess_Lesson_View } from "@/Page/Chess/Lesson";
import { Chess_Puzzle_View } from "@/Page/Chess/Puzzle";

// Language Modular Views
import Language_Root from "@/Page/Language/Root";
import Language_Index from "@/Page/Language/Index";

// Language Lesson Views (Split routes)
import Levels_Page from "@/Page/Language/Lesson/Index";
import Level_Page from "@/Page/Language/Lesson/Level";
import Lesson_Runner_Page from "@/Page/Language/Lesson/Lesson";

// Language Dictionary Views
import Dictionary_Root from "@/Page/Language/Dictionary/Root";
import Dictionary_Category from "@/Page/Language/Dictionary/Category";
import Dictionary_Subcategory from "@/Page/Language/Dictionary/Subcategory";
import Dictionary_Word from "@/Page/Language/Dictionary/Word";
import Word_Detail_View from "@/Page/Language/Dictionary/Detail";

const queryClient = new QueryClient();

const RouteLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <App_Provider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/Sign" element={<Auth_Page />} />

              {/* Layout-wrapped application paths */}
              <Route element={<RouteLayout />}>
                <Route path="/" element={<Root_Picker />} />

                {/* Explicit Navigation Tree for Chess */}
                <Route path="/Chess">
                  <Route index element={<Chess_Index />} />
                  <Route path="Play" element={<Chess_Play_View />} />
                  <Route path="Puzzle" element={<Chess_Puzzle_View />} />

                  {/* Lessons Navigation Routes mapped to Chess_Lesson_View */}
                  <Route path="Lesson">
                    <Route index element={<Chess_Lesson_View />} />
                    <Route path=":Category">
                      <Route index element={<Chess_Lesson_View />} />
                      <Route path=":subcategory">
                        <Route index element={<Chess_Lesson_View />} />
                        <Route path=":Lesson_ID" element={<Chess_Lesson_View />} />
                      </Route>
                    </Route>
                  </Route>
                </Route>

                {/* Strictly Capitalized Navigation Trees */}
                <Route path="/Language">
                  <Route index element={<Language_Root />} />
                  <Route path=":Lang_Name">
                    <Route index element={<Language_Index />} />

                    {/* Language Lessons Nested Router Structure */}
                    <Route path="Lesson">
                      {/* Levels Grid (e.g. /Language/English/Lesson) */}
                      <Route index element={<Levels_Page />} />
                      {/* Lessons Grid (e.g. /Language/English/Lesson/I) */}
                      <Route path=":Level_Id">
                        <Route index element={<Level_Page />} />
                        {/* Lesson Runner (e.g. /Language/English/Lesson/I/The-Alphabet) */}
                        <Route path=":Lesson_Slug" element={<Lesson_Runner_Page />} />
                      </Route>
                    </Route>

                    <Route path="Dictionary">
                      <Route index element={<Dictionary_Root />} />
                      <Route path="Vocabulary">
                        <Route index element={<Dictionary_Category />} />
                        <Route path=":Category_ID" element={<Dictionary_Subcategory />} />
                        <Route path=":Category_ID/:Subcategory_ID" element={<Dictionary_Word />} />
                        <Route path=":Category_ID/:Subcategory_ID/:Word_ID" element={<Word_Detail_View />} />
                      </Route>
                    </Route>
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Not_Found />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </App_Provider>
    </QueryClientProvider>
  );
}