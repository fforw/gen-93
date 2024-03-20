import config from "./config"
import { easeInOutCubic } from "./easing"


export default function alphaDegrade(ctx)
{
    const { width, height, random} = config

    ctx.save()
    ctx.globalCompositeOperation = "destination-out"

    const count = (width * height) * 0.05
    for (let i = 0; i < count; i++)
    {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + random.next() * 0.03})`
        const x = Math.floor(random.next() * width)
        const y = Math.floor(random.next() * height)

        if (Math.random() < 0.5)
        {
            ctx.fillRect(x-1,y-1,2,2)
        }
        else
        {
            ctx.fillRect(x-2,y-2,4,4)
        }
    }
    ctx.restore()
}
