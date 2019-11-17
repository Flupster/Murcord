const { mumble } = require("../bot");

exports.start = () => {
  mumble.on("connect", user => {
    if (user.isAdmin()) {
      mumble.addContextAction(user, "SetShuffle", "Shuffle", "channel");
    }
  });

  mumble.on("context:SetShuffle", (user, target, channel) => {
    let revert = new Map();
    const users = [...mumble.users].filter(
      ([userid, user]) => user.channel === channel
    );

    let names = users.map(([userid, user]) => user.name);

    users.forEach(([userid, user]) => {
      revert.set(userid, user.name);
      const newName = names[Math.floor(Math.random() * names.length)];
      names = names.filter(x => x !== newName);
      user.setNickname(newName);
    });

    setTimeout(() => {
      revert.forEach((name, userid) => {
        const user = mumble.users.get(userid);
        if (user) user.setNickname(name);
      });
    }, 300000);
  });
  mumble.on("mumble:context", x => console.log(x));
};
