
export default function weightedRandom(choices)
{
    let sum = 0;

    for (let i = 0; i < choices.length; i += 2)
    {
        const weight = choices[i]
        sum += weight;
    }

    return (ctx, rnd, ... args) => {

        let val = rnd * sum;

        const length = choices.length - 2;
        let i;
        for (i = 0; i < length; i += 2)
        {
            const weight = choices[i    ]
            const fn = choices[i + 1]

            val -= weight;
            if (val < 0)
            {
                return fn(ctx, ... args)
            }
        }

        const fn = choices[i + 1];
        return fn(ctx, ... args)
    }
}
