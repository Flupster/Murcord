module.exports = {
  name: "roll",
  description: "Roll a dice",
  options: [
    {
      name: "dices",
      description: "Number of dices | DEFAULT 1",
      type: "INTEGER",
      required: false,
    },
    {
      name: "sides",
      description: "Number of sides | DEFAULT 6",
      type: "INTEGER",
      required: false,
    },
  ],
  async execute(interaction) {
    const dices = interaction.options.getInteger("dices") ?? 1;
    const sides = interaction.options.getInteger("sides") ?? 6;

    if (dices > 10 || sides > 10000) {
      return interaction.reply({
        content: "Too many dice or sides, MAX: 10 dice, 10000 sides",
        ephemeral: true,
      });
    }

    const results = [];

    for (let i = 0; i < dices; i++) {
      results.push(Math.random() * (sides - 1) + 1);
    }

    return interaction.reply(
      results.map((r) => `${Math.round(r)}/${sides}`).join(", ")
    );
  },
};
