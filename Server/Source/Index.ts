import Express, { Request, Response } from 'express';
import Path from 'path';
import { fileURLToPath } from 'url';
import OS from 'os';
import Cors from 'cors'; 
import { 
  Supported_Language,
  Get_Vocabulary,
  Get_Vocabulary_By_Slug,
  Get_Grammar,
  Get_Grammar_By_Slug,
  Get_Lessons,
  Get_Lesson_By_Slug
} from './API/Language.js';
import { Get_Chess_Levels, Get_All_Puzzles, Get_Puzzle_By_FEN } from './API/Chess.js';

const File_Name = fileURLToPath(import.meta.url);
const Directory_Name = Path.dirname(File_Name);

const App = Express();
const Port = process.env.PORT || 4000;

App.use(Express.json());

// Enable expanded CORS for GitHub Codespaces proxy
App.use(Cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Expose static assets
App.use('/assets/Corpus', Express.static(Path.join(Directory_Name, '../Asset/Corpus')));

/**
 * Language Database API Routing Pipeline
 */
App.get('/api/language-Corpus', (Req: Request, Res: Response): void => {
  const Language = Req.query.lang as string;
  if (!Language) {
    Res.status(400).json({ error: "Missing required query parameter: 'lang'." });
    return;
  }
  
  const Code_To_Name_Map: Record<string, Supported_Language> = {
    nl: "Dutch",
    en: "English",
    ar: "Arabic",
    ps: "Pashto"
  };
  
  const Full_Language_Name: Supported_Language = Code_To_Name_Map[Language] || (Language as Supported_Language);

  const Type = Req.query.type as string; // 'vocabulary' | 'grammar' | 'lessons'
  const Category = Req.query.category as string;
  const Subcategory = Req.query.subcategory as string;
  const Level = Req.query.level as string;
  const Slug = Req.query.slug as string;

  try {
    // 1. Direct Slug Lookup
    if (Slug) {
      if (Type === 'vocabulary') {
        const item = Get_Vocabulary_By_Slug(Full_Language_Name, Slug);
        if (!item) { Res.status(404).json({ error: `Vocabulary item '${Slug}' not found.` }); return; }
        Res.json(item);
        return;
      }
      if (Type === 'grammar') {
        const item = Get_Grammar_By_Slug(Full_Language_Name, Slug);
        if (!item) { Res.status(404).json({ error: `Grammar rule '${Slug}' not found.` }); return; }
        Res.json(item);
        return;
      }
      if (Type === 'lessons') {
        const item = Get_Lesson_By_Slug(Full_Language_Name, Slug);
        if (!item) { Res.status(404).json({ error: `Lesson '${Slug}' not found.` }); return; }
        Res.json(item);
        return;
      }
    }

    // 2. Section Specific Queries
    if (Type === 'vocabulary') {
      Res.json({ vocabulary: Get_Vocabulary(Full_Language_Name, Category, Subcategory) });
      return;
    }

    if (Type === 'grammar') {
      Res.json({ grammar: Get_Grammar(Full_Language_Name, Category, Subcategory) });
      return;
    }

    if (Type === 'lessons') {
      Res.json({ lessons: Get_Lessons(Full_Language_Name, Level) });
      return;
    }

    // 3. Default: Aggregated Language Corpus
    Res.json({
      vocabulary: Get_Vocabulary(Full_Language_Name),
      grammar: Get_Grammar(Full_Language_Name),
      lessons: Get_Lessons(Full_Language_Name)
    });

  } catch (Error: any) {
    console.error("[API Error] Failed serving /api/language-Corpus:", Error);
    Res.status(500).json({ error: Error.message || "Failed to query language database." });
  }
});

/**
 * Unified Chess API Route
 */
App.get('/api/chess', (Req: Request, Res: Response): void => {
  const FEN = Req.query.fen as string;
  const Puzzles_Only = Req.query.puzzles === 'true';
  const Levels_Only = Req.query.levels === 'true';

  try {
    // 1. Specific Puzzle Request
    if (FEN) {
      const Puzzle = Get_Puzzle_By_FEN(FEN);
      if (!Puzzle) {
        Res.status(404).json({ error: `Puzzle with FEN '${FEN}' not found.` });
        return;
      }
      Res.json(Puzzle);
      return;
    }

    // 2. Puzzles Only Request
    if (Puzzles_Only) {
      Res.json({ puzzles: Get_All_Puzzles() });
      return;
    }

    // 3. Levels Only Request
    if (Levels_Only) {
      Res.json({ levels: Get_Chess_Levels() });
      return;
    }

    // 4. Default: Return Everything
    const Levels = Get_Chess_Levels();
    const Puzzles = Get_All_Puzzles();
    Res.json({ levels: Levels, puzzles: Puzzles });

  } catch (Error: any) {
    console.error("[API Error] Failed serving /api/chess:", Error);
    Res.status(500).json({ error: Error.message || "Failed to query chess data." });
  }
});

function Get_Network_IP(): string {
  const Interfaces = OS.networkInterfaces();
  for (const Name of Object.keys(Interfaces)) {
    for (const Interface of Interfaces[Name] || []) {
      if (Interface.family === 'IPv4' && !Interface.internal) {
        return Interface.address;
      }
    }
  }
  return '127.0.0.1';
}

App.listen(Port, () => {
  const Network_IP = Get_Network_IP();

  const Cyan = '\x1b[36m';
  const Bold = '\x1b[1m';
  const Dim = '\x1b[2m';
  const Reset = '\x1b[0m';

  console.log(`\n  ${Cyan}➜${Reset}  ${Bold}Local:${Reset}   ${Cyan}http://localhost:${Port}/${Reset}`);
  console.log(`  ${Cyan}➜${Reset}  ${Bold}Network:${Reset} ${Dim}http://${Network_IP}:${Port}/${Reset}\n`);
});