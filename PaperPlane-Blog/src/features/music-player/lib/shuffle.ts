export type RandomSource = () => number;

export const shuffleCopy = <T>(items: readonly T[], random: RandomSource = Math.random): T[] => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }

    return shuffled;
};
