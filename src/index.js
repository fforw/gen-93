import domready from "domready"
import "./style.css"
import Color from "./Color"
import { randomPaletteWithBlack } from "./randomPalette"
import spectral from "spectral.js"
import weightedRandom from "./weightedRandom"
import Prando from "prando"
import { clamp } from "./util"
import { createNoise3D } from "simplex-noise"
import { TAU } from "./constants"
import config from "./config"
import screentone from "./screentone"
import { easeInOutCubic, easeInOutQuad } from "./easing"
import alphaDegrade from "./alpha-degrade"



/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

/**
 * @type CanvasRenderingContext2D
 */
let tmpCtx;
let tmpCanvas;
let random
let noise

const positions = [
    [  0, 0],
    [  1, 0],
    [1/3, 1/3],
    [2/3, 1/3],
    [1/3, 2/3],
    [2/3, 2/3],
    [  0, 1],
    [  1, 1],

    [ 0, 0.5],
    [ 1, 0.5],
    [ 0.5, 0],
    [ 0.5, 1],
    [ 0.5, 0.5]
]


function toScreen(pos)
{
    const { width, height } = config

    return [
        Math.floor(pos[0] * width),
        Math.floor(pos[1] * height),
    ]
}


function isInHistory(history, posA, posB)
{
    for (let i = 0; i < history.length; i++)
    {
        const [a,b] = history[i]
        if (
            (
                posA[0] === a[0] && posA[1] === a[1] &&
                posB[0] === b[0] && posB[1] === b[1]
            ) ||
            (
                posA[0] === b[0] && posA[1] === b[1] &&
                posB[0] === a[0] && posB[1] === a[1]
            )
        )
        {
            return true
        }
    }
    return false
}

function randomPair(palette)
{
    const colA = palette[0|random.next() * palette.length]
    let colB
    do
    {
        colB = palette[0|random.next() * palette.length]
    } while (colA === colB)

    return [ colA, colB]
}


function randomPositionPair(history)
{
    let posA
    let posB
    do
    {
        posA = positions[0 | random.next() * positions.length]
        posB = positions[0 | random.next() * positions.length]

    } while (posA === posB || isInHistory(history, posA, posB))

    let result = [toScreen(posA), toScreen(posB)]
    history.push(result)
    return result
}

function distance(p0, p1)
{
    const [x, y] = p0

    const dx = p1[0] - x
    const dy = p1[1] - y

    return Math.sqrt(dx * dx + dy * dy)
}

function circleShape(ctx, p0,p1)
{
    const [x, y] = p0
    const r = distance(p0, p1)

    ctx.moveTo(x + r, y)
    ctx.arc(x, y, r, 0, TAU, true)

    return true
}

function lineShape(ctx, p0,p1)
{
    const [x0, y0] = p0
    const [x1, y1] = p1

    const dx = x1 - x0
    const dy = y1 - y0

    const d = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    const lineWidth = Math.max(1, Math.floor(d * Math.pow(random.next(), 2) * 0.05))

    const pt0 = (x0,y0,angle,d) => ctx.moveTo(x0 + Math.cos(angle) * d, y0 + Math.sin(angle) * d )
    const pt1 = (x0,y0,angle,d) => ctx.lineTo(x0 + Math.cos(angle) * d, y0 + Math.sin(angle) * d )

    const a45 = TAU/8

    const dw = Math.sqrt(lineWidth*lineWidth/2)

    pt0(x0,y0,angle - a45, dw)
    pt1(x0,y0,angle + a45, dw)
    pt1(x1,y1,angle + TAU/2 - a45, dw)
    pt1(x1,y1,angle + TAU/2 + a45, dw)
    pt1(x0,y0,angle - a45, dw)

    return false
}

function squareShape(ctx, p0,p1)
{
    const [x0, y0] = p0
    const [x1, y1] = p1

    const dx = x1 - x0
    const dy = y1 - y0

    const d = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    ctx.moveTo(x0 + Math.cos(angle) * d, y0 + Math.sin(angle) * d )
    ctx.lineTo(x0 + Math.cos(angle + TAU/4) * d, y0 + Math.sin(angle + TAU/4) * d )
    ctx.lineTo(x0 + Math.cos(angle + TAU/2) * d, y0 + Math.sin(angle + TAU/2) * d )
    ctx.lineTo(x0 + Math.cos(angle + 3*TAU/4) * d, y0 + Math.sin(angle + 3*TAU/4) * d )
    ctx.lineTo(x0 + Math.cos(angle) * d, y0 + Math.sin(angle) * d )
    return true
}

let marked = []

function randomShape(ctx, p0,p1, canBeMarked)
{
    const rnd = random.next()
    
    const isMarkedShaped = _randomShape(ctx, rnd, p0,p1)
    if (isMarkedShaped && canBeMarked && random.next() < 0.5)
    {
        marked.push([ctx, rnd, p0, p1])
    }

    return isMarkedShaped
}

function mark()
{
    const { width, height} = config

    ctx.lineWidth = Math.floor(Math.sqrt(width * width + height * height) * 0.00046)
    ctx.strokeStyle = "rgba(0,0,0,0.85)"
    ctx.beginPath()
    for (let i = 0; i < marked.length; i++)
    {
        const [ctx, rnd, p0, p1] = marked[i]
        _randomShape(ctx, rnd, p0,p1)
    }
    ctx.stroke()
    marked = []
}


const _randomShape = weightedRandom([
    4, circleShape,
    2, squareShape,
    1, lineShape
])

function paintLayer(ctx, isMarkedLayer)
{
    const history = []
    ctx.beginPath()

    const count = Math.round(2 + random.next() * 2)
    for (let i = 0; i < count; i++)
    {
        const [p0, p1] = randomPositionPair(history)
        randomShape(ctx, p0,p1, isMarkedLayer)
    }
}


function generateFill(colA, colB)
{
    const { width, height} = config

    const choice = Math.floor(4 * random.next())
    let x0,y0,x1,y1
    switch (choice)
    {
        default:
            x0 = 0
            y0 = 0
            x1 = 0
            y1 = height
            break
        case 1:
            x0 = 0
            y0 = 0
            x1 = width
            y1 = 0
            break
        case 2:
            x0 = 0
            y0 = height
            x1 = 0
            y1 = 0
            break
        case 3:
            x0 = width
            y0 = 0
            x1 = 0
            y1 = 0
            break
    }

    const len = 256
    const spread = spectral.palette(
        Color.from(colA).toRGBHex(),
        Color.from(colB).toRGBHex(),
        len,
        spectral.HEX
    )

    const gradient = ctx.createLinearGradient(x0,y0,x1,y1);
    const delta = 1/len
    let a = 0
    for (let i = 0; i < len; i++)
    {
        const col = spread[i]
        gradient.addColorStop(i * delta, Color.from(col).toRGBA(Math.sqrt(a)))
        a += delta
    }
    return gradient
}

function seed()
{
    return Math.floor((Math.random() - 0.5) * 4294967295)
}


function createImageGradient(fill, paint)
{
    const { width, height} = config

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    ctx.fillStyle = fill
    ctx.fillRect(0,0,width,height)
    paint(ctx)

    return canvas
}

function fract(v)
{
    return v - (v|0)
}


function shape(v)
{
    return v
}


function noiseDisplacement(ctx)
{
    const { width, height} = config

    const src = ctx.getImageData(0, 0, width, height)
    const dst = ctx.getImageData(0, 0, width, height)


    const getOffset = (x, y) => ((y | 0) * width + (x | 0)) << 2

    const noiseOffsetGun = (x, y, xz, yz) => {
        const ns = 0.25
        const displacement = 28

        const dx = shape(noise(x * ns, y * ns, xz) * displacement)
        const dy = shape(noise(x * ns, y * ns, yz) * displacement)

        const x0 = clamp(x + dx, width - 1)
        const y0 = clamp(y + dy, height - 1)

        const fx = fract(x0)
        const fy = fract(y0)

        const srcOff0 = getOffset(x0, y0)
        const srcOff1 = getOffset(clamp(x0 + 1, width - 1), y0)
        const srcOff2 = getOffset(x0, clamp(y0 + 1, height - 1))

        return [fx, fy, srcOff0, srcOff1, srcOff2]
    }

    const rxz = random.next() * 13
    const ryz = random.next() * 23
    const gxz = random.next() * 31
    const gyz = random.next() * 17
    const bxz = random.next() * 29
    const byz = random.next() * 19

    const { data: srcData } = src
    const { data: dstData } = dst
    let dstOff = 0

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            {
                const [fx, fy, srcOff0, srcOff1, srcOff2] = noiseOffsetGun(x, y, rxz, ryz)
                const r0 = srcData[srcOff0    ]
                const r1 = srcData[srcOff1    ]
                const r2 = srcData[srcOff2    ]
                
                const rx = r0 + (r1 - r0) * fx
                dstData[dstOff    ] = Math.floor(rx + (r2 - rx) * fy)
            }

            {
                const [fx, fy, srcOff0, srcOff1, srcOff2] = noiseOffsetGun(x, y, gxz, gyz)
                const g0 = srcData[srcOff0 + 1]
                const a0 = srcData[srcOff0 + 3]
                const g1 = srcData[srcOff1 + 1]
                const a1 = srcData[srcOff1 + 3]
                const g2 = srcData[srcOff2 + 1]
                const a2 = srcData[srcOff2 + 3]
                const gx = g0 + (g1 - g0) * fx
                const ax = a0 + (a1 - a0) * fx
                
                dstData[dstOff + 1] = Math.floor(gx + (g2 - gx) * fy)
                dstData[dstOff + 3] = Math.floor(ax + (a2 - ax) * fy)
            }
            {
                const [fx, fy, srcOff0, srcOff1, srcOff2] = noiseOffsetGun(x, y, bxz, byz)
                const b0 = srcData[srcOff0 + 2]
                const b1 = srcData[srcOff1 + 2]
                const b2 = srcData[srcOff2 + 2]
                const bx = b0 + (b1 - b0) * fx
                dstData[dstOff + 2] = Math.floor(bx + (b2 - bx) * fy)
            }
            dstOff += 4
        }
    }

    ctx.putImageData(dst, 0, 0)
}



function degrade(ctx)
{
    const { width, height} = config

    ctx.save()
    ctx.lineWidth = 1
    ctx.globalCompositeOperation = "destination-out"


    const count = (width * height) * 0.003
    for (let i = 0; i < count; i++)
    {
        ctx.strokeStyle = `rgba(0,0,0,${0.04 + random.next() * 0.03})`
        ctx.beginPath()
        const x = Math.floor(random.next() * width)
        const y = Math.floor(random.next() * height)
        const l = Math.floor(50 + Math.random() * 200)

        const hl = l/2


        let pos = 0;

        while(pos < l)
        {
            const step = easeInOutCubic(pos/l) * Math.floor( 1 + random.next() * l/3)

            ctx.moveTo(x,y - hl + pos)
            ctx.lineTo(x,y - hl + pos + step)

            pos += step + Math.floor(1 + random.next() * 2)

        }
        ctx.stroke()
    }
    ctx.restore()

    const g = ctx.createLinearGradient(0,0,0,height)

    const randomAlpha = () => random.next() * 0.15
    for (let i = 0; i < 1; i += (0.1 + random.next() * 0.15))
    {
        g.addColorStop(i, `rgba(0,0,0,${ randomAlpha() })`)
    }
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height)

}


window.onload = (
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        tmpCanvas = document.createElement("canvas")
        tmpCanvas.width = width
        tmpCanvas.height = height

        tmpCtx = tmpCanvas.getContext("2d")

        const paint = () => {

            let id = seed()
            random = new Prando(id)
            config.random = random
            noise = createNoise3D(() => random.next())

            const palette = randomPaletteWithBlack(random.next())
            ctx.fillStyle = palette[0|random.next() * palette.length] ;
            ctx.fillRect(0,0, width, height)

            const count = 3
            const marked = Math.floor(random.next() * count)
            for (let i = 0; i < count; i++)
            {
                const [colA, colB] = randomPair(palette)
                const fill = generateFill(colA, colB)

                tmpCtx.clearRect(0,0,width,height)

                paintLayer(tmpCtx,i === marked)
                tmpCtx.fillStyle = fill
                tmpCtx.fill("evenodd")
                mark()

                alphaDegrade(tmpCtx)

                ctx.drawImage(tmpCanvas, 0, 0)
            }
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
