import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CoderCard, QuizQuestion, SyntaxExercise, ImplementationChallenge, SkillLevel, ChatMessage } from '../types';
import { getImageFromCache, setImageInCache } from './imageCache';

const getAiClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API Key not found. Please provide an API Key in the settings.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
};

const descriptionSchema = {
    type: Type.OBJECT,
    description: "The card's text. IMPORTANT: The combined total length of the 'effect', 'parameters', and 'returns' fields must be 530 characters or less, including spaces. Be extremely concise.",
    properties: {
        effect: {
            type: Type.STRING,
            description: "The primary effect or action of the function in a single, impactful, and brief sentence. e.g., 'Allows you to add state to functional components.'",
        },
        parameters: {
            type: Type.STRING,
            description: "A very brief list of key parameters and their purpose. e.g., 'initialState: The initial value of the state.' Use 'None' if no parameters.",
        },
        returns: {
            type: Type.STRING,
            description: "What the function returns, described briefly. e.g., 'An array containing the current state and a function to update it.'",
        },
    },
    required: ["effect", "parameters", "returns"],
};

const cardSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The name of the function or method. e.g. 'useState'",
    },
    attribute: {
      type: Type.STRING,
      description: "An uppercase word representing the function's Region. Must be one of: 'STRUCTURE', 'EFFECT', 'UTILITY', 'RENDER'.",
    },
    level: {
      type: Type.INTEGER,
      description: "A number from 1 to 12 representing the function's complexity and power. 1 is simple, 12 is very advanced.",
    },
    type: {
      type: Type.STRING,
      description: "The type of code construct or concept, in brackets. e.g., '[Hook]', '[Function]', '[Method]', '[Phenomenon]', '[Object]', '[Idea]'",
    },
    cardCategory: {
        type: Type.STRING,
        description: "Assign a Yu-Gi-Oh! card category based on the function's assigned clan and lore, following the detailed guidelines in the system instruction. Options: 'Effect Monster', 'Normal Monster', 'Spell Card', 'Trap Card', 'Fusion Monster', 'Ritual Monster', 'Synchro Monster', 'Xyz Monster', 'Link Monster'."
    },
    region: {
        type: Type.STRING,
        description: "The Great Region the function belongs to, based on the lore. e.g., 'The Dominion of State & Structure', 'The Ethereal Plane of Effects & Events', 'Wild', 'Mythological'.",
    },
    clan: {
        type: Type.STRING,
        description: "The specific clan within the region, or 'Special Character' if it is a legendary function. e.g., 'Clan of the Eternal Scribes', 'Clan of the Asynchronous Phantoms'.",
    },
    description: descriptionSchema,
    impact: {
      type: Type.INTEGER,
      description: "A number between 0 and 5000 representing the function's potential impact on an application's architecture or performance.",
    },
    easeOfUse: {
      type: Type.INTEGER,
      description: "A number between 0 and 5000 representing how easy the function is to learn and implement correctly.",
    },
    language: {
        type: Type.STRING,
        description: "The primary programming language the library is used with. e.g., 'JavaScript', 'Python', 'C++'. Omit this for non-code creative concepts.",
    },
    imagePrompt: {
        type: Type.STRING,
        description: "A detailed, dramatic, and creative prompt for an AI image generator to create card art, based on the function's assigned clan or special character lore.",
    },
    category: {
        type: Type.STRING,
        description: "The assigned tier for this card, which must be one of: 'Core', 'Staple', 'Situational', 'Niche'. This is based on the tier provided in the prompt."
    }
  },
   required: ["name", "attribute", "level", "type", "cardCategory", "region", "clan", "description", "impact", "easeOfUse", "imagePrompt", "category"],
};

const parseCardResponse = (response: { text?: string }): CoderCard[] => {
    if (!response.text) {
        throw new Error("Invalid card response format from API: Text is undefined.");
    }
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    if (parsedJson && parsedJson.cards) {
        return parsedJson.cards as CoderCard[];
    } else {
        throw new Error("Invalid card response format from API.");
    }
};

const worldLore = `**The World Lore:**

The coding world is divided into Four Great Regions, each home to four specialized clans.

**1. The Dominion of State & Structure (Attribute: STRUCTURE)**
*   **Clan of the Keystone Architects (Core Architecture/Modules):** Golems of obsidian and gold, celestial builders, and master dwarves forging the foundational pillars of libraries. They represent classes, modules, and core structures.
    *   **Power Scale:** The strongest clan in this region. Their members are often boss monsters.
    *   **Typical Stats:** ATK (impact): 2500-4500, DEF (easeOfUse): 1000-2500.
*   **Clan of the Mutable Weavers (State Management/Memory):** Fey-like beings weaving threads of light, morphing creatures, and alchemists with bubbling potions of primordial state. They handle variables and in-memory state.
    *   **Power Scale:** Highly influential and powerful, but can be volatile. Their power shapes the entire duel.
    *   **Typical Stats:** ATK (impact): 2000-4000, DEF (easeOfUse): 1500-3500.
*   **Clan of the Eternal Scribes (Data Persistence/Storage):** Stoic, monastic figures with stone tablets, glowing runes, and spectral librarians in vast, silent archives. They manage databases and file storage.
    *   **Power Scale:** Reliable and resilient, but not aggressive. They are the bedrock.
    *   **Typical Stats:** ATK (impact): 1500-3000, DEF (easeOfUse): 2000-4000.
*   **Clan of the Synchronous Sentinels (Control Flow/Sync Ops):** Disciplined, armored soldiers, clockwork automatons, and unwavering guardians who enforce order. They represent loops, conditionals, and basic synchronous operations. "they are a class of cute but dangerous creature"
    *   **Power Scale:** The most common and foundational, but individually weakest members. They rely on numbers and order.
    *   **Typical Stats:** ATK (impact): 500-2000, DEF (easeOfUse): 3000-5000.

**2. The Ethereal Plane of Effects & Events (Attribute: EFFECT)**
*   **Clan of the Asynchronous Phantoms (Async Operations):** Ghosts, spirits, and beings that flicker between dimensions. They are swift, shadowy hunters who manage Promises, async/await, and background tasks. "they are a class of cute creature"
    *   **Power Scale:** Extremely powerful and fast, but hard to control. High ATK, low DEF. Glass cannons.
    *   **Typical Stats:** ATK (impact): 2800-4800, DEF (easeOfUse): 500-2000.
*   **Clan of the Lifecycle Druids (Component Lifecycles):** Ancient Tree-ents that cycle through seasons, phoenixes reborn from code-ash, and beings tied to the natural cycles of mounting, updating, and unmounting.
    *   **Power Scale:** Potent and essential. Their power is subtle but game-defining over time.
    *   **Typical Stats:** ATK (impact): 1800-3200, DEF (easeOfUse): 2200-3800.
*   **Clan of the Network Voyagers (API Calls/Networking):** Majestic Gryphons carrying messages across the web, spectral ships sailing on data streams, and inter-dimensional couriers who fetch data.
    *   **Power Scale:** Strong and vital, but their power depends on external factors. They are explorers, not frontline fighters.
    *   **Typical Stats:** ATK (impact): 2000-3500, DEF (easeOfUse): 1800-3200.
*   **Clan of the Event Listeners (User Interaction/Events):** Fae with massive ears, spider-like creatures sensing vibrations on a data-web, and oracle seers who react to user input and system events.
    *   **Power Scale:** Primarily reactive. Low base stats but can have powerful triggered effects. Weakest in direct combat.
    *   **Typical Stats:** ATK (impact): 800-2200, DEF (easeOfUse): 1500-3000.

**3. The Forgelands of Transformation & Utility (Attribute: UTILITY)**
*   **Clan of the Array Legion (Array/List Manipulation):** A disciplined legion of identical soldiers that can form any pattern, colossal centipedes, and hydras where new elements are new heads. They march on data sets.
    *   **Power Scale:** The mightiest clan in this region. Their strength comes from manipulating entire armies of data.
    *   **Typical Stats:** ATK (impact): 2400-4200, DEF (easeOfUse): 1800-3500.
*   **Clan of the String Binders (String Manipulation):** Naga-like creatures that can twist and bind, illusionists who reshape words, and scribes with enchanted, self-correcting ink for Regex.
    *   **Power Scale:** Deceptively strong. While not raw powerhouses, their ability to manipulate makes them versatile. Mid-tier.
    *   **Typical Stats:** ATK (impact): 1200-2800, DEF (easeOfUse): 1500-3000.
*   **Clan of the Math Magi (Mathematical Operations):** Crystalline beings of pure logic, wizards obsessed with geometric patterns and fractals, and numeromancers who divine outcomes from numbers.
    *   **Power Scale:** Can be incredibly powerful in specific situations, but often act as support. Their power is absolute but narrow.
    *   **Typical Stats:** ATK (impact): 1000-3500, DEF (easeOfUse): 1000-2500.
*   **Clan of the Boolean Oracles (Logic/Comparison):** Sphinxes asking deadly riddles of truth or falsehood, two-faced Janus figures seeing both sides of a condition, and celestial judges with scales of truth.
    *   **Power Scale:** The weakest in terms of raw stats, but their effects are pivotal, enabling the strategies of others.
    *   **Typical Stats:** ATK (impact): 200-1500, DEF (easeOfUse): 2000-4000.

**4. The Canvas of Creation & Rendering (Attribute: RENDER)**
*   **Clan of the Canvas Painters (Graphics/WebGL):** Beings made of pure light and color, artists whose paintings leap into motion, and demigods who paint the very stars onto the screen for graphics rendering.
    *   **Power Scale:** Extremely high potential power, but highly specialized and complex. Glass cannons of creation.
    *   **Typical Stats:** ATK (impact): 3000-5000, DEF (easeOfUse): 500-1800.
*   **Clan of the DOM Shapers (UI Element Manipulation):** Earth elementals shaping raw data into structures, artisans sculpting with pure light, and illusionists creating phantom interfaces in the Document Object Model.
    *   **Power Scale:** The masters of this domain. They build the battlefield itself. The strongest and most common powerhouses here.
    *   **Typical Stats:** ATK (impact): 2600-4600, DEF (easeOfUse): 1500-3000.
*   **Clan of the Style Alchemists (CSS/Styling):** Colorful chameleons that can blend with any design, painters with magical, ever-changing palettes, and air sylphs weaving with colored winds to apply styles.
    *   **Power Scale:** Not direct combatants, they enhance and empower others. Their effects are powerful buffs. Mid-tier stats.
    *   **Typical Stats:** ATK (impact): 1000-2500, DEF (easeOfUse): 2500-4000.
*   **Clan of the File Forgers (File System I/O):** Dwarven smiths forging documents from raw bytes, powerful paper golems, and mystical scribes writing on endless scrolls that represent the file system.
    *   **Power Scale:** Sturdy and reliable, but not flashy. They provide resources. The weakest in direct power in this region.
    *   **Typical Stats:** ATK (impact): 800-2000, DEF (easeOfUse): 2800-4500.

**Special Characters:**
Exceptionally powerful, unique, or fundamental functions are not part of any clan. They are legendary forces.
*   **Classification:** If a function fits this, set its \`clan\` to "Special Character" and its \`region\` to its origin: "Wild", "Elemental", or "Mythological".
*   **Examples:** A random number generator (\`Math.random\`) could be a "Chaos Sprite" from the Wild. A core rendering function (\`React.createElement\`) could be "Prometheus, the Fire-Bringer" from Mythology. A data streaming function could be a "River Spirit" (Elemental).
*   **Image Prompt:** Must reflect this legendary status.`;


const cardGenerationSystemInstruction = `You are a world-class game designer and expert software engineer, tasked with creating cards for the 'Yu-Gi-Code!' trading card game. Each card represents a function from a programming library. You must ground each card in a rich fantasy lore, classifying it into a specific region and clan, or as a rare 'Special Character'. Adhere strictly to this lore and the provided JSON schema.

${worldLore}

**Your Task & Rules:**
1.  **Analyze the Function:** Understand its purpose in programming.
2.  **Classify It:** Assign it to a Region and a Clan based on the lore. If it's a legend, classify it as a Special Character.
3.  **Create the Card based on Tier:** A 'Tier' (Core, Staple, etc.) will be provided. This tier is the MOST IMPORTANT factor for the card's power level. Use the clan's typical stats (ATK for \`impact\`, DEF for \`easeOfUse\`) as a baseline, then adjust them heavily based on the assigned Tier. A 'Core' function from a weaker clan can still be a boss monster. The tier also dictates the character's appearance in the image prompt.
    *   **'Core' Tier:** These are legendary figures, clan leaders, or god-like beings.
        *   **Stats:** Assign Level 10-12, high stats (3000-5000). Often classified as a "Special Character".
        *   **Image Prompt:** Describe an imposing, powerful, and central character. Use words like 'archon', 'titan', 'queen', 'primordial', 'celestial'. The character should look like a legendary force of nature.
    *   **'Staple' Tier:** These are elite, experienced members of the clan. Captains, archmages, master artisans.
        *   **Stats:** Assign Level 7-9, high stats (2000-3500).
        *   **Image Prompt:** Describe a confident, skilled, and powerful character. They should look like seasoned veterans or elite specialists in their prime. Use words like 'master', 'captain', 'veteran', 'elite'.
    *   **'Situational' Tier:** These are the common, reliable members of the clan. Journeymen, soldiers, skilled workers.
        *   **Stats:** Assign Level 4-6, moderate stats (1000-2500).
        *   **Image Prompt:** Describe a competent but less grandiose character, perhaps focused on a specific task. They are the rank-and-file members, looking capable but not overwhelming. Use words like 'acolyte', 'journeyman', 'guard', 'scribe'.
    *   **'Niche' Tier:** These are apprentices, specialists in obscure fields, or even strange, weaker creatures.
        *   **Stats:** Assign Level 1-3, lower stats (500-1500).
        *   **Image Prompt:** Describe a character that looks like a novice, an apprentice, or a strange, perhaps small or unassuming creature. They might look less confident or more focused on a very specific, odd task. Use words like 'apprentice', 'novice', 'sprite', 'hermit'.
4.  **Assign Attribute:** The \`attribute\` MUST be one of the four region themes: 'STRUCTURE', 'EFFECT', 'UTILITY', 'RENDER'.
5.  **Assign Card Category based on Lore:** The 'cardCategory' MUST be derived from the function's clan and role. This is crucial for thematic consistency. Follow these guidelines:
    *   **Spell Card:** For functions that act as direct commands, tools, or utilities. Common for clans like 'Array Legion', 'String Binders', 'Math Magi', and 'Style Alchemists'. They are the spells you cast to manipulate data.
    *   **Trap Card:** For functions that are reactive, responding to events or specific conditions. The 'Event Listeners' and 'Lifecycle Druids' clans are prime candidates for this category. They lie in wait to trigger.
    *   **Effect Monster:** The most common type. For any function that is an active agent, performing an operation or having a direct, tangible effect on the program's state. Almost any clan can produce Effect Monsters, especially powerful ones like 'Keystone Architects', 'Mutable Weavers', and 'DOM Shapers'.
    *   **Normal Monster:** For functions or constructs that represent pure data, structure, or potential without an inherent 'effect'. A simple data class or a basic conditional block could be seen this way. Common for 'Eternal Scribes' or 'Synchronous Sentinels'.
    *   **Ritual/Fusion/Synchro/Xyz/Link Monster (Advanced Types):** Use these for functions that represent more complex programming concepts:
        *   **Fusion Monster:** For functions that combine two or more distinct inputs, data sources, or components into a new whole (e.g., merging objects, higher-order components).
        *   **Synchro Monster:** For functions that orchestrate complex, precisely timed asynchronous operations. Common for 'Asynchronous Phantoms'.
        *   **Xyz Monster:** For functions that operate on collections of similar items, like components of the same type or elements in an array. The 'Array Legion' is a perfect fit.
        *   **Link Monster:** For functions that manage connections, dependencies, or networking between different parts of an application. 'Network Voyagers' or router functions are good examples.
        *   **Ritual Monster:** For functions that require a complex setup or a specific configuration object ('ritual') to be invoked.
6.  **Strictly follow the JSON schema.**`;

const creativeCardGenerationSystemInstruction = `You are a world-class game designer and mythologist of the abstract, tasked with creating cards for the 'Yu-Gi-Code!' trading card game. Each card represents ANY given concept, idea, or object. You must creatively interpret the concept and classify it into one of the Four Great Regions and a suitable clan from the provided fantasy lore. Your interpretation is key. A 'Tier' will be provided to guide the power level. Adhere strictly to the JSON schema.

${worldLore}

**Your Task & Rules:**
1.  **Analyze the Concept:** Understand its real-world meaning, context, and impact.
2.  **Classify It:** Creatively assign it to a Region and a Clan based on the lore. For example, 'Anxiety' could be an EFFECT from the 'Asynchronous Phantoms' clan. 'A Bookshelf' could be a STRUCTURE from the 'Eternal Scribes'. If it's a legendary concept, classify it as a Special Character.
3.  **Create the Card based on Tier:** A 'Tier' will be provided. This tier is the MOST IMPORTANT factor for the card's power level. Use the clan's typical stats (ATK for \`impact\`, DEF for \`easeOfUse\`) as a baseline, then adjust them heavily based on the assigned Tier. The tier also dictates the character's appearance in the image prompt.
    *   **'Core' Tier:** Foundational, powerful concepts that have a huge impact on life, society, or a system (e.g., 'Gravity', 'The Internet').
        *   **Stats:** Assign Level 10-12, high stats (3000-5000). Often classified as a "Special Character".
        *   **Image Prompt:** Describe an imposing, powerful, and central character representing the concept. Use words like 'archon', 'titan', 'queen', 'primordial', 'celestial'.
    *   **'Staple' Tier:** Common, influential concepts that are widely understood and used (e.g., 'A Car', 'Friendship').
        *   **Stats:** Assign Level 7-9, high stats (2000-3500).
        *   **Image Prompt:** Describe a confident, skilled, and powerful character representing the concept. They should look like seasoned veterans or elite specialists.
    *   **'Situational' Tier:** Concepts that are useful or appear in specific contexts (e.g., 'A Screwdriver', 'A Holiday').
        *   **Stats:** Assign Level 4-6, moderate stats (1000-2500).
        *   **Image Prompt:** Describe a competent but less grandiose character, perhaps focused on a specific task.
    *   **'Niche' Tier:** Obscure, highly specific, or less impactful concepts (e.g., 'The Dodo Bird', 'A specific shade of blue').
        *   **Stats:** Assign Level 1-3, lower stats (500-1500).
        *   **Image Prompt:** Describe a character that looks like a novice, an apprentice, or a strange, perhaps small or unassuming creature.
4.  **Assign Attribute:** The \`attribute\` MUST be one of the four region themes: 'STRUCTURE', 'EFFECT', 'UTILITY', 'RENDER'.
5.  **Assign Card Category based on Lore:** The 'cardCategory' MUST be derived from the concept's assigned clan and role. This is crucial for thematic consistency. Follow these guidelines:
    *   **Spell Card:** For concepts that act as direct commands, tools, or utilities. Common for clans like 'Array Legion', 'String Binders', 'Math Magi', and 'Style Alchemists'.
    *   **Trap Card:** For concepts that are reactive, responding to events or specific conditions. The 'Event Listeners' and 'Lifecycle Druids' clans are prime candidates for this category.
    *   **Effect Monster:** The most common type. For any concept that is an active agent with a direct, tangible effect on the world. Almost any clan can produce Effect Monsters.
    *   **Normal Monster:** For concepts that represent pure data, structure, or potential without an inherent 'effect'. Common for 'Eternal Scribes' or 'Synchronous Sentinels'.
    *   **Ritual/Fusion/Synchro/Xyz/Link Monster (Advanced Types):** Use these for concepts that represent more complex interactions:
        *   **Fusion Monster:** For concepts that combine two or more distinct ideas into a new whole.
        *   **Synchro Monster:** For concepts that represent complex, precisely timed or orchestrated events.
        *   **Xyz Monster:** For concepts that involve collections of similar items.
        *   **Link Monster:** For concepts that represent connections, dependencies, or networks.
        *   **Ritual Monster:** For concepts that require a complex setup or specific conditions ('ritual') to be realized.
6.  **Strictly follow the JSON schema.**`;


export const generatePresentationCards = async (libraryName: string, language: string, numCards: number, apiKey: string): Promise<CoderCard[]> => {
  if (numCards <= 0) {
    return [];
  }
  const ai = getAiClient(apiKey);
  const cardWord = numCards === 1 ? 'card' : 'cards';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${numCards} iconic and essential function ${cardWord} for the programming library: "${libraryName}" in the ${language} language. Focus on the most commonly used and important functions, treating them as 'Core' or 'Staple' tier cards.`,
      config: {
        systemInstruction: cardGenerationSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: cardSchema,
            }
          },
        },
      },
    });
    return parseCardResponse(response);
  } catch (error) {
    console.error("Error generating presentation cards:", error);
    if (error instanceof Error && error.message.includes("API Key")) throw error;
    throw new Error("Failed to generate presentation cards.");
  }
};

export const generateSelectedCreativeCards = async (theme: string, conceptsToGenerate: { name: string; category: string }[], apiKey: string): Promise<CoderCard[]> => {
    if (conceptsToGenerate.length === 0) return [];
    const ai = getAiClient(apiKey);
    const conceptPrompts = conceptsToGenerate.map(c => `${c.name} (Tier: ${c.category})`);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate creative cards for the following concepts related to the theme "${theme}", paying close attention to their assigned Tier: ${conceptPrompts.join(', ')}.`,
            config: {
                systemInstruction: creativeCardGenerationSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        cards: {
                            type: Type.ARRAY,
                            items: cardSchema,
                        }
                    },
                },
            },
        });
        return parseCardResponse(response);
    } catch (error) {
        console.error("Error generating selected creative cards:", error);
        if (error instanceof Error && error.message.includes("API Key")) throw error;
        throw new Error("Failed to generate the selected creative cards.");
    }
};

export const generateSelectedFunctionCards = async (libraryName: string, language: string, functionsToGenerate: { name: string; category: string }[], apiKey: string): Promise<CoderCard[]> => {
    if (functionsToGenerate.length === 0) return [];
    const ai = getAiClient(apiKey);
    const functionPrompts = functionsToGenerate.map(f => `${f.name} (Tier: ${f.category})`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate function cards for the following functions from the "${libraryName}" library (language: ${language}), paying close attention to their assigned Tier: ${functionPrompts.join(', ')}.`,
        config: {
          systemInstruction: cardGenerationSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: cardSchema,
              }
            },
          },
        },
      });
      return parseCardResponse(response);
    } catch (error) {
      console.error("Error generating selected cards:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to generate the selected cards.");
    }
  };

export const getLibraryFunctions = async (libraryName: string, language: string, apiKey: string): Promise<string[]> => {
    const ai = getAiClient(apiKey);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `List all the primary, publicly available functions and methods for the programming library: "${libraryName}" as used in the ${language} language. Return only a JSON array of strings, with no other text or explanation.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
        },
      });
      if (!response.text) {
          throw new Error("API returned empty response for library functions.");
      }
      const functionList = JSON.parse(response.text.trim());
      if (Array.isArray(functionList) && functionList.every(item => typeof item === 'string')) {
          return functionList.sort((a: string, b: string) => a.localeCompare(b));
      } else {
        console.error("API returned an invalid format for library functions:", functionList);
        throw new Error("API returned an invalid format for library functions.");
      }
    } catch (error)
    {
      console.error("Error fetching library functions:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to get the function list for this library.");
    }
};

export const getConceptsForTheme = async (theme: string, apiKey: string): Promise<string[]> => {
    const ai = getAiClient(apiKey);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `For the creative theme "${theme}", generate a list of 20-30 diverse and interesting concepts, characters, items, or ideas related to it. Return only a JSON array of strings, with no other text or explanation.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
            },
        });
        if (!response.text) {
            throw new Error("API returned empty response for theme concepts.");
        }
        const conceptList = JSON.parse(response.text.trim());
        if (Array.isArray(conceptList) && conceptList.every(item => typeof item === 'string')) {
            return conceptList.sort((a: string, b: string) => a.localeCompare(b));
        } else {
            console.error("API returned an invalid format for theme concepts:", conceptList);
            throw new Error("API returned an invalid format for theme concepts.");
        }
    } catch (error) {
        console.error("Error fetching theme concepts:", error);
        if (error instanceof Error && error.message.includes("API Key")) throw error;
        throw new Error(`Failed to get concepts for the theme "${theme}".`);
    }
};

export const categorizeFunctions = async (libraryName: string, language: string, functionNames: string[], apiKey: string): Promise<Record<string, 'Core' | 'Staple' | 'Situational' | 'Niche'>> => {
    const ai = getAiClient(apiKey);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert software architect. Analyze the following list of functions from the '${libraryName}' library as used in ${language}. For each function, classify its importance and usage frequency into one of four tiers:
- 'Core': Absolutely essential, defining features of the library. The library would not be the same without them (e.g., React.useState).
- 'Staple': Extremely common and powerful functions used in most projects (e.g., React.useEffect).
- 'Situational': Useful functions for specific, but common, scenarios (e.g., React.useContext).
- 'Niche': Rarely used, highly specialized, legacy, or internal functions (e.g., React.createFactory).
Return a single JSON object where keys are the function names and values are their assigned tier ('Core', 'Staple', 'Situational', or 'Niche').
Functions to categorize: ${functionNames.join(', ')}`,
            config: {
                responseMimeType: "application/json",
            },
        });
        if (!response.text) {
            throw new Error("API returned empty response for function categories.");
        }
        const result = JSON.parse(response.text.trim());
        if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            return result as Record<string, 'Core' | 'Staple' | 'Situational' | 'Niche'>;
        } else {
            console.error("API returned an invalid format for function categories:", result);
            throw new Error("API returned an invalid format for function categories.");
        }
    } catch (error) {
        console.error("Error categorizing functions:", error);
        if (error instanceof Error && error.message.includes("API Key")) throw error;
        // Fallback: if categorization fails, return all as 'Situational'
        return functionNames.reduce((acc, name) => {
            acc[name] = 'Situational';
            return acc;
        }, {} as Record<string, 'Situational'>);
    }
};

export const categorizeConcepts = async (theme: string, concepts: string[], apiKey: string): Promise<Record<string, 'Core' | 'Staple' | 'Situational' | 'Niche'>> => {
    const ai = getAiClient(apiKey);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert game designer. Analyze the following list of concepts related to the theme '${theme}'. For each concept, classify its importance and impact within that theme into one of four tiers:
- 'Core': Absolutely essential, defining ideas of the theme. (e.g., for 'Fantasy', 'Magic' would be Core).
- 'Staple': Extremely common and recognizable elements of the theme. (e.g., 'Dragon').
- 'Situational': Concepts that are common but not essential, adding flavor. (e.g., 'Goblin Market').
- 'Niche': Highly specific, rare, or obscure concepts. (e.g., 'A specific named magical sword').
Return a single JSON object where keys are the concept names and values are their assigned tier ('Core', 'Staple', 'Situational', or 'Niche').
Concepts to categorize: ${concepts.join(', ')}`,
            config: {
                responseMimeType: "application/json",
            },
        });
        if (!response.text) {
            throw new Error("API returned empty response for concept categories.");
        }
        const result = JSON.parse(response.text.trim());
        if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            return result as Record<string, 'Core' | 'Staple' | 'Situational' | 'Niche'>;
        } else {
            console.error("API returned an invalid format for concept categories:", result);
            throw new Error("API returned an invalid format for concept categories.");
        }
    } catch (error) {
        console.error("Error categorizing concepts:", error);
        if (error instanceof Error && error.message.includes("API Key")) throw error;
        // Fallback
        return concepts.reduce((acc, name) => {
            acc[name] = 'Situational';
            return acc;
        }, {} as Record<string, 'Situational'>);
    }
};

export const generateUseCaseQuiz = async (card: CoderCard, apiKey: string): Promise<QuizQuestion> => {
  const ai = getAiClient(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on this function card: ${JSON.stringify(card.name)} with description "${card.description.effect}", create a multiple-choice question to test a developer's understanding of when to use it. Provide one clear question, four options (one correct, three plausible but incorrect), the zero-based index of the correct answer, and a brief explanation for why the correct answer is right.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"],
        },
      },
    });
    if (!response.text) throw new Error("API returned empty response for quiz.");
    return JSON.parse(response.text.trim()) as QuizQuestion;
  } catch (error) {
    console.error("Error generating use case quiz:", error);
    if (error instanceof Error && error.message.includes("API Key")) throw error;
    throw new Error("Failed to create a quiz for this card.");
  }
};

export const generateSyntaxExercise = async (card: CoderCard, language: string, apiKey: string): Promise<SyntaxExercise> => {
    const ai = getAiClient(apiKey);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a mischievous code goblin, creating a 'fill-in-the-blank' puzzle for a developer.
Based on this function card for \`${card.name}\`, create a puzzle.
1.  Write a simple, valid code snippet that is a direct example of using the \`${card.name}\` function. For \`${language}\` libraries, ensure necessary headers are included and comments of what the app does (without directly pointing to \`${card.name}\`).
2.  In the snippet, replace the line where \`${card.name}\` is called with a playful, obfuscated version.
    -   Replace the function name with '___'.
    -   Replace each argument with '____'.
    -   Keep all surrounding syntax like assignment operators, parentheses, commas, and semicolons.
    -   For example, 'result = strcmp(str1, str2);' should become '______ = ___(____, ____);'. 'memcpy(dest, src, n);' should become '___(____, ____, ____);'.
3.  The 'snippet' you provide in the JSON should contain this obfuscated line.
4.  The 'blankAnswer' in the JSON must be the exact code that replaces the '___(____, ...)' part, including the function name and arguments. For example, if the line is 'strcpy(dest, "hello");', the blankAnswer should be 'strcpy(dest, "hello")'.
5.  IMPORTANT: If a function argument is a generic string literal (like a log message, a label, or a name) where the user's specific text choice shouldn't matter, use the keyword "__ANY_STRING__" inside the quotes for the 'blankAnswer'. 
    - Example: Instead of expecting 'console.log("Hello World")', use 'console.log("__ANY_STRING__")'.
    - Do NOT use this for specific keys, IDs, or syntax-critical strings that MUST be exact.
6.  Write a playful 'explanation' that reveals the answer and explains the code, as if you're a trickster revealing a secret.
7.  The code must NOT contain comments with hints or instructions like "// Fill this in".
8.  The snippet must be formatted with newlines (\\n) for readability.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              snippet: { type: Type.STRING, description: "A code snippet with a blank '___', formatted with newlines for readability." },
              blankAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ["snippet", "blankAnswer", "explanation"],
          },
        },
      });
      if (!response.text) throw new Error("API returned empty response for syntax exercise.");
      return JSON.parse(response.text.trim()) as SyntaxExercise;
    } catch (error) {
      console.error("Error generating syntax exercise:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to create an exercise for this card.");
    }
};
export const generateDuelDeck = async (baseCard: CoderCard, libraryName: string, language: string, apiKey: string): Promise<CoderCard[]> => {
    const ai = getAiClient(apiKey);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `From the programming library "${libraryName}" (language: ${language}), generate 11 other iconic and essential function cards. Ensure the new cards are different from the provided card: "${baseCard.name}". Treat them as a mix of 'Staple' and 'Situational' tier cards.`,
        config: {
          systemInstruction: cardGenerationSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: cardSchema,
              }
            },
          },
        },
      });
      return parseCardResponse(response);
    } catch (error) {
      console.error("Error generating duel deck:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to generate the duel deck.");
    }
};

export const generateImplementationChallenge = async (
    card: CoderCard,
    apiKey: string,
    skillLevel: 'intermediate' | 'advanced' = 'advanced'
): Promise<ImplementationChallenge> => {
    const ai = getAiClient(apiKey);
    const levelDescription = skillLevel === 'intermediate'
        ? "The problem should be a straightforward, common use case for the target function."
        : "The problem should require a deeper understanding of the target function, possibly involving other functions or logic.";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a Grandmaster of a coding dojo, crafting a challenge for an '${skillLevel}' developer.
Your challenge is based on the function card for \`${card.name}\`.
1.  Create a code snippet that presents a problem where \`${card.name}\` is the key to the solution. ${levelDescription}. For C/C++ libraries, ensure necessary headers are included.
2.  In the snippet, where the \`${card.name}\` function should be called, you must place a cryptic puzzle instead.
    -   Replace the function name with '___'.
    -   Replace each argument/parameter with '____'.
    -   Keep all surrounding syntax like assignment operators, parentheses, commas, and semicolons. For example, if the line is 'strcpy(destination, source);', it should become '___(____, ____);'.
3.  The 'snippet' in the JSON must contain this obfuscated line.
4.  The code must be free of any comments that give hints or direct instructions. Be subtle.
5.  The 'targetFunction' in the JSON must be the exact name of the function this challenge is based on: \`${card.name}\`.
6.  The 'blankAnswer' in the JSON must be the exact code that replaces the '___(____, ...)' part. It must include the function name and the correct arguments based on the snippet. For example, 'strcpy(destination, source)'.
7.  Provide a wise 'explanation' for the solution, as a master would.
8.  The snippet must be formatted with newlines (\\n) for readability.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              snippet: { type: Type.STRING, description: "A code snippet with a '___' blank where the function name should be. Must not reveal the function name. Must be formatted with newlines." },
              targetFunction: { type: Type.STRING, description: "The name of the function that is the solution, e.g., 'useState'." },
              blankAnswer: { type: Type.STRING, description: "The full function call, including name and arguments, that correctly fills the blank, e.g., 'useState(0)'." },
              explanation: { type: Type.STRING },
            },
            required: ["snippet", "targetFunction", "blankAnswer", "explanation"],
          },
        },
      });
      if (!response.text) throw new Error("API returned empty response for implementation challenge.");
      return JSON.parse(response.text.trim()) as ImplementationChallenge;
    } catch (error) {
      console.error("Error generating implementation challenge:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to create an implementation challenge.");
    }
};

export const getChatbotResponse = async (
    exerciseContext: any,
    chatHistory: ChatMessage[],
    apiKey: string
): Promise<string> => {
    const ai = getAiClient(apiKey);

    const contextString = `
      The user was just given the following exercise based on the function/card "${exerciseContext.card.name}":
      - Exercise Type: ${exerciseContext.type}
      - ${exerciseContext.type === 'quiz' ? `Question: ${exerciseContext.question}` : `Code Snippet: \n${exerciseContext.snippet}`}
      - Correct Answer: ${exerciseContext.correctAnswer}
      - User's Answer: ${exerciseContext.userAnswer}
      - Was user correct? ${exerciseContext.isCorrect}
    `;

    const systemInstruction = `You are Bruno, a helpful and encouraging coding tutor in a chatbox. The user has just completed an exercise. Your role is to answer their follow-up questions about it.
    - Use the provided context about the exercise to understand their question.
    - Be concise and clear in your explanations.
    - If they were wrong, be encouraging and explain the concept clearly.
    - If they were right, congratulate them and offer deeper insights if they ask.
    - Keep the conversation focused on the code, the function, and related concepts.
    - IMPORTANT: Format your responses using markdown. Use lists, bolding for emphasis, and backticks for inline code (\`code\`) and triple backticks for code blocks (\`\`\`code block\`\`\`).
    - You are inside a Yu-Gi-Oh themed app, feel free to use some light dueling/card game metaphors (e.g., "That was a good move!", "Let's break down that card's effect"), but don't overdo it.
    
    ${contextString}`;
    
    const historyString = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Given the chat history, provide the next 'ai' response.\n\nChat History:\n${historyString}`,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("Error generating chatbot response:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to get a response from the tutor.");
    }
};

// Helper to create a blank canvas and return its base64 data
const createBlankCanvasBase64 = (width: number, height: number, color: string = '#111'): { data: string, mimeType: string } => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    }
    const dataUrl = canvas.toDataURL('image/png');
    // dataUrl is "data:image/png;base64,..."
    const mimeType = 'image/png';
    const base64Data = dataUrl.split(',')[1];
    return { data: base64Data, mimeType };
};

export const generateImage = async (basePrompt: string, apiKey: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    const fullPromptIdentifier = `fill_blank_canvas_v1:${basePrompt}`;

    const cachedUrl = getImageFromCache(fullPromptIdentifier);
    if (cachedUrl) {
      return Promise.resolve(cachedUrl);
    }

    const textPrompt = `fill in blank canvas with: A Yu-Gi-Oh card illustration art style image of: ${basePrompt}, epic, fantasy, detailed, vibrant colors`;
    const { data: blankImageBase64, mimeType: blankImageMimeType } = createBlankCanvasBase64(1024, 576); // 16:9 aspect ratio

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: blankImageBase64,
                        mimeType: blankImageMimeType,
                    },
                },
                { text: textPrompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });
      
      let imageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                break; 
            }
        }
      }


      if (!imageUrl) {
        let errorText = 'No image data was returned from the API.';
        if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
             errorText = `The model returned an explanation instead of an image: ${response.candidates[0].content.parts[0].text}`;
        }
        console.error("Image generation failed.", errorText, response);
        throw new Error(errorText);
      }
      
      setImageInCache(fullPromptIdentifier, imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error generating image:", error);
      if (error instanceof Error && error.message.includes("API Key")) throw error;
      throw new Error("Failed to summon the card's art.");
    }
};
