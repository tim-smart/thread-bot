import { InteractionsRegistry } from "dfx/gateway"
import { Discord, Ix } from "dfx"
import { Effect, Encoding, Layer, Option } from "effect"
import { DiscordLive } from "./Discord.js"

export const PlaygroundLive = Effect.gen(function* () {
  const registry = yield* InteractionsRegistry

  const linkFromCode = (code: string) =>
    Effect.sync(() => {
      const encoded = Encoding.encodeBase64Url(code)
      return `https://effect.website/play/?code=${encoded}`
    })

  const menu = Ix.global(
    {
      type: Discord.ApplicationCommandType.MESSAGE,
      name: "Open in playground",
    },
    Effect.fn("Playground.command")(
      function* (ix) {
        const code = yield* extractCode(ix.target.content)
        const url = yield* linkFromCode(code)

        const response = `Here is your [playground link](${url}).`
        if (response.length > 1950) {
          return Ix.response({
            type: Discord.InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: Discord.MessageFlag.EPHEMERAL,
              content: `The code snippet is too long to be displayed in a single message.`,
            },
          })
        }
        return Ix.response({
          type: Discord.InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: Discord.MessageFlag.EPHEMERAL,
            content: `Here is your [playground link](${url}).`,
          },
        })
      },
      Effect.catchTag("NoSuchElementException", () =>
        Effect.succeed(
          Ix.response({
            type: Discord.InteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: Discord.MessageFlag.EPHEMERAL,
              content: "No code snippets were found in the message.",
            },
          }),
        ),
      ),
    ),
  )

  const ix = Ix.builder.add(menu).catchAllCause(Effect.logError)
  yield* registry.register(ix)
}).pipe(Layer.effectDiscard, Layer.provide(DiscordLive))

const extractCode = (content: string): Option.Option<string> => {
  const codeBlock = content.matchAll(/```.*$([\s\S]*?)```/gm)
  const items = [...codeBlock]
  return items.length > 0
    ? Option.some(items.map(([, code]) => code.trim()).join("\n\n\n"))
    : Option.none()
}
