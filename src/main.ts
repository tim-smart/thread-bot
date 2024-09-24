import { AutoThreadsLive } from "bot/AutoThreads"
import { DocsLookupLive } from "bot/DocsLookup"
import { IssueifierLive } from "bot/Issueifier"
import { NoEmbedLive } from "bot/NoEmbed"
import { Summarizer } from "bot/Summarizer"
import { TracingLive } from "bot/Tracing"
import { Config, Effect, Layer, LogLevel, Logger } from "effect"
import { RemindersLive } from "./Reminders.js"
import { DadJokesLive } from "./DadJokes.js"
import { NodeRuntime } from "@effect/platform-node"
import { MentionsLive } from "./Mentions.js"

const LogLevelLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const debug = yield* Config.withDefault(Config.boolean("DEBUG"), false)
    const level = debug ? LogLevel.All : LogLevel.Info
    return Logger.minimumLogLevel(level)
  }),
)

const MainLive = Layer.mergeAll(
  AutoThreadsLive,
  DadJokesLive,
  NoEmbedLive,
  DocsLookupLive,
  IssueifierLive,
  RemindersLive,
  Summarizer.Live,
  MentionsLive,
).pipe(Layer.provide(TracingLive), Layer.provide(LogLevelLive))

NodeRuntime.runMain(Layer.launch(MainLive))
