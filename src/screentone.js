import { TAU } from "./constants"
import config from "./config"


let screentoneMask

export function paintScreentoneMask(ctx, dotSize = 10, gap = 2)
{
    const { width, height } = ctx.canvas

    ctx.fillStyle = "#fff"

    const r = dotSize/2
    const d = dotSize + gap

    const xStep = (dotSize + gap)
    const xStepHalf = xStep / 2
    const yStep = Math.round(Math.sqrt(d * d - xStepHalf * xStepHalf ))

    let even = false
    const yLimit = height + yStep/2
    for (let y = 0; y < yLimit; y += yStep)
    {
        const xLimit = even ? width + xStep : width
        for (let x = even ?  0 : -Math.floor(xStepHalf); x < xLimit; x += xStep)
        {
            ctx.beginPath()
            ctx.moveTo(x + r , y)
            ctx.arc(x, y, r, 0, TAU, true)
            ctx.fill()
        }
        even = !even
    }
}

export default function screentone(ctx)
{
    const { width, height, random} = config

    if (!screentoneMask)
    {
        screentoneMask = document.createElement("canvas")
        screentoneMask.width = width
        screentoneMask.height = height

        paintScreentoneMask(
            screentoneMask.getContext("2d"),
            Math.floor(8 + random.next() * 2),
            1
        )
    }

    ctx.save()

    const hw = width >> 1
    const hh = height >> 1

    ctx.translate(hw, hh)
    ctx.rotate( Math.floor(random.next() * 12) * 30)
    ctx.translate(-hw, -hh)

    ctx.globalCompositeOperation = "destination-in"
    ctx.drawImage(screentoneMask, 0, 0)
    ctx.restore()
}
