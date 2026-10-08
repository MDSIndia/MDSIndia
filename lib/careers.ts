/** Open positions shown on /careers. Each one opens its own page at
 * /careers/<slug>. The Co-Founder role has a long, bespoke page (see
 * CoFounderRoleContent); every other role is rendered from this data by
 * RoleDetail, so adding an opening is just adding an entry here.
 *
 * `icon` is a name, not a component, so this file stays usable from server
 * components (the route's generateStaticParams) — the client maps it to an
 * actual lucide icon. */

export type RoleIcon = "crown" | "wand" | "cube" | "figure" | "code" | "phone" | "server" | "brain";

export interface CareerRole {
  slug: string;
  title: string;
  /** Short label shown above the title on the card. */
  team: string;
  /** One line shown on the card. */
  summary: string;
  icon: RoleIcon;
  color: string;
  tags: string[];
  /** Everything below is used by RoleDetail (not the Co-Founder page). */
  about?: string[];
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
}

export const CAREER_ROLES: CareerRole[] = [
  {
    slug: "co-founder",
    title: "Co-Founder (COO)",
    team: "Leadership",
    summary:
      "An ambitious co-creator of MDS's vision — an executive role as COO across product, operations, people and growth.",
    icon: "crown",
    color: "#00D4FF",
    tags: ["Executive", "Equity", "Hyderabad"],
  },
  {
    slug: "rive-animator",
    title: "Rive Animator",
    team: "Animation",
    summary:
      "Bring Noorva's interface and characters to life with interactive Rive animation, including raster and image-based animation.",
    icon: "wand",
    color: "#A855F7",
    tags: ["Rive", "Raster animation", "Interactive"],
    about: [
      "Noorva Companion is only as believable as the way it moves. As our Rive Animator you will design the motion that makes the product feel alive — from small interface responses to expressive character animation.",
      "You will work in Rive, building animations that react to user input through state machines, and you will also be comfortable animating raster (image-based) assets, not only vector artwork.",
    ],
    responsibilities: [
      "Design and build interactive animations in Rive for the Noorva Companion app and the MDS website.",
      "Create state-machine-driven animations that respond to taps, gestures, emotion and conversation state.",
      "Animate raster and image-based assets — frame sequences, textured and mesh-deformed images — and prepare them to run smoothly in Rive.",
      "Collaborate with designers and developers so animations are implemented cleanly and perform well on mobile.",
      "Keep file sizes and runtime cost low without losing polish.",
    ],
    requirements: [
      "Hands-on experience animating in Rive, including state machines and inputs.",
      "Experience animating raster / image-based assets, with a solid sense of timing, easing and character.",
      "A portfolio that shows finished, interactive animation work (links to Rive files or recordings are ideal).",
      "Comfort working with developers and iterating from feedback.",
    ],
    niceToHave: [
      "Experience with bone rigging and mesh deformation.",
      "Background in character animation or motion design.",
      "Familiarity with After Effects, Lottie or Spine.",
    ],
  },
  {
    slug: "unity-3d-animator",
    title: "3D Unity Animator",
    team: "Animation",
    summary:
      "Create expressive 3D character and scene animation in Unity for Noorva's companion experiences.",
    icon: "cube",
    color: "#0055FF",
    tags: ["Unity", "3D animation", "Characters"],
    about: [
      "We are building companions people form real relationships with, and that depends on natural, expressive movement. As our 3D Unity Animator you will own the animation that gives those characters presence.",
      "You will work directly inside Unity, taking animation from first pass to a polished, game-ready result.",
    ],
    responsibilities: [
      "Create character animation — idles, gestures, emotional reactions and transitions — for use in Unity.",
      "Build and tune Animator Controllers, blend trees and state transitions.",
      "Set up cinematics and sequences using Timeline.",
      "Work with riggers, artists and developers to get animation into the build and running well on mobile.",
      "Iterate on feel and performance based on playtesting and feedback.",
    ],
    requirements: [
      "Professional or strong portfolio experience in 3D animation, with Unity as a working tool.",
      "Solid grasp of animation fundamentals: timing, weight, anticipation and follow-through.",
      "Experience with Animator Controllers, blend trees and importing animation from DCC tools.",
      "A portfolio or showreel of 3D character animation.",
    ],
    niceToHave: [
      "Motion capture clean-up or retargeting experience.",
      "Facial animation or lip-sync experience.",
      "Familiarity with Blender, Maya or similar tools.",
    ],
  },
  {
    slug: "3d-character-artist",
    title: "3D Character Artist & Rigger",
    team: "Art",
    summary:
      "Model, texture and rig the characters of the Noorva Ecosystem, ready to animate in Unity.",
    icon: "figure",
    color: "#EC4899",
    tags: ["Modelling", "Rigging", "Unity"],
    about: [
      "Every Noorva companion starts as a character someone has to design in three dimensions. You will take concepts from sculpt to a fully rigged, optimised model that animators and developers can use straight away.",
    ],
    responsibilities: [
      "Model and texture stylised or realistic characters from concept art.",
      "Build clean, animation-ready topology and efficient UVs.",
      "Rig characters, including facial rigs and blend shapes for expression.",
      "Optimise models and materials for real-time use on mobile devices in Unity.",
      "Work closely with animators to fix deformation and rig issues quickly.",
    ],
    requirements: [
      "Portfolio of 3D character work, including at least one rigged, animation-ready character.",
      "Strong skills in a 3D package such as Blender, Maya or ZBrush, plus texturing tools.",
      "Understanding of real-time constraints: polycount, texture budgets and shader cost.",
    ],
    niceToHave: [
      "Experience with facial rigging and blend-shape workflows.",
      "Experience exporting and setting up characters in Unity.",
      "A good eye for expressive, friendly character design.",
    ],
  },
  {
    slug: "unity-developer",
    title: "Unity Developer",
    team: "Engineering",
    summary:
      "Build the interactive 3D experiences of Noorva in Unity, from character systems to mobile performance.",
    icon: "code",
    color: "#2DD4BF",
    tags: ["Unity", "C#", "Mobile"],
    about: [
      "You will turn characters, animation and design into working, performant interactive experiences. This role sits between the art, animation and AI teams and makes sure everything runs beautifully on real devices.",
    ],
    responsibilities: [
      "Develop interactive features and systems in Unity using C#.",
      "Integrate character models, animation and UI built by the art and animation team.",
      "Connect the Unity front end to Noorva's backend and AI services.",
      "Profile and optimise for smooth performance on mobile devices.",
      "Write clear, maintainable code and help establish good practices as the team grows.",
    ],
    requirements: [
      "Solid experience developing in Unity with C#.",
      "Experience shipping or prototyping interactive 3D applications.",
      "Understanding of the Animator system, UI and asset pipelines in Unity.",
      "Comfort profiling and optimising for mobile.",
    ],
    niceToHave: [
      "Experience integrating REST or WebSocket APIs, or AI/voice services.",
      "Experience with shaders or the Universal Render Pipeline.",
      "Experience with Android or iOS builds.",
    ],
  },
  {
    slug: "flutter-developer",
    title: "Flutter Developer",
    team: "Engineering",
    summary:
      "Build the Noorva Companion mobile app with Flutter — fast, beautiful and smooth on both Android and iOS.",
    icon: "phone",
    color: "#FB923C",
    tags: ["Flutter", "Dart", "Mobile"],
    about: [
      "Noorva Companion lives in people's pockets, so the app has to feel effortless. As our Flutter Developer you will build and refine the mobile experience that millions of people could one day use every day.",
      "You will work closely with designers, animators and the backend and AI teams to turn rich, expressive designs into a polished, reliable app.",
    ],
    responsibilities: [
      "Build and maintain the Noorva Companion mobile app in Flutter and Dart for Android and iOS.",
      "Turn designs into pixel-accurate, responsive interfaces, including custom animations and transitions.",
      "Integrate the app with backend APIs, real-time services and AI features.",
      "Manage app state cleanly and keep the codebase organised and testable.",
      "Profile and optimise performance, startup time and battery use.",
    ],
    requirements: [
      "Solid experience building production Flutter apps with Dart.",
      "Experience with a state-management approach such as Riverpod, Bloc or Provider.",
      "Experience consuming REST or WebSocket APIs and handling authentication.",
      "A portfolio, published apps or code samples we can look at.",
    ],
    niceToHave: [
      "Experience embedding animation (Rive or Lottie) in Flutter.",
      "Experience with push notifications, in-app purchases or on-device storage.",
      "Experience publishing to the Play Store and App Store.",
    ],
  },
  {
    slug: "backend-developer",
    title: "Backend Developer",
    team: "Engineering",
    summary:
      "Design and build the secure, scalable services that power the Noorva Ecosystem.",
    icon: "server",
    color: "#FBBF24",
    tags: ["APIs", "Cloud", "Databases"],
    about: [
      "Behind every Noorva conversation is a backend that has to be fast, reliable and trustworthy with people's data. As our Backend Developer you will build the services the whole product depends on.",
      "You will shape the architecture from the early stages, so good judgement and a habit of writing clear, maintainable code matter as much as any one technology.",
    ],
    responsibilities: [
      "Design, build and maintain APIs and services for the Noorva Companion app and website.",
      "Model data and manage databases with performance and privacy in mind.",
      "Handle authentication, authorisation and the secure storage of user data.",
      "Connect the product to AI services and other third-party systems.",
      "Set up deployment, monitoring and logging so the system stays healthy as it grows.",
    ],
    requirements: [
      "Strong experience building backend services in a language such as Node.js, Python, Go or Java.",
      "Experience designing REST APIs and working with relational and/or NoSQL databases.",
      "Understanding of security basics: authentication, secrets management and data protection.",
      "Experience deploying to a cloud platform such as AWS, GCP or Azure.",
    ],
    niceToHave: [
      "Experience with real-time communication (WebSockets) and message queues.",
      "Experience with Docker and CI/CD pipelines.",
      "Experience supporting AI or machine-learning workloads in production.",
    ],
  },
  {
    slug: "ai-engineer",
    title: "AI Engineer",
    team: "AI",
    summary:
      "Build the emotionally aware, human-centered AI at the heart of Noorva Companion.",
    icon: "brain",
    color: "#4ADE80",
    tags: ["LLMs", "Emotional AI", "Machine learning"],
    about: [
      "MDS is developing Emotional AI, Affective AI and Human-Interactive AI so that technology can understand context, emotions and people. As our AI Engineer you will help turn that vision into working systems.",
      "You will take ideas from research and experiment to production, building the models and pipelines that make Noorva feel genuinely helpful and human.",
    ],
    responsibilities: [
      "Design, build and evaluate AI features for Noorva Companion, from conversation to personalisation.",
      "Work with large language models: prompting, retrieval, fine-tuning and evaluation.",
      "Build data pipelines and experiments, and measure quality with clear metrics.",
      "Research and prototype approaches to understanding emotion and context in interactions.",
      "Work with the backend team to run models reliably, quickly and cost-effectively in production.",
      "Help set sensible standards for safety, privacy and responsible AI.",
    ],
    requirements: [
      "Strong experience in machine learning or applied AI, with Python as a primary language.",
      "Hands-on experience building with LLMs and modern ML frameworks such as PyTorch.",
      "Ability to take a prototype to a production system and to measure whether it works.",
      "Curiosity about how AI can serve people better, and clear thinking about its risks.",
    ],
    niceToHave: [
      "Experience in affective computing, emotion recognition or conversational AI.",
      "Experience with speech, voice or multimodal models.",
      "Experience with MLOps and deploying models at scale.",
      "Published research or open-source work.",
    ],
  },
];

export function getRole(slug: string): CareerRole | undefined {
  return CAREER_ROLES.find((r) => r.slug === slug);
}
