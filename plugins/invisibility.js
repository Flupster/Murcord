const { mumble } = require("../bot");

exports.start = () => {
  mumble.on("connect", user => {
    if (user.isAdmin()) {
      mumble.addContextAction(user, "SetInvisibility", "Invisibility", "channel");
    }
  });

  mumble.on("context:SetInvisibility", (user, target, channel) => {
    let revert = new Map();
    const users = [...mumble.users].filter(
      ([userid, user]) => user.channel === channel
    );

    [...mumble.users]
    .filter(([userid, user]) => user.channel === channel)
    .forEach(([userid, user]) => {
      revert.set(userid, user.name);
      user.setNickname("");
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
