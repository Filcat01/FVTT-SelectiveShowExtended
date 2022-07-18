Hooks.on("ready", () => {
    JournalEntry.prototype.show = async function (mode = "text", force = false) {
        if (!this.isOwner) throw new Error(game.i18n.localize("selectiveshow.MustBeAnOwnerError"));
        let selection = await new Promise(resolve => {
            new SelectiveShowApp(resolve).render(true);
        })

        game.socket.emit("module.selectiveshowextended", { id: this.uuid, mode, force, selection, type: "journal" });
    }


    ImagePopout.prototype.shareImage = async function (mode = "text", force = false) {
        let selection = await new Promise(resolve => {
            new SelectiveShowApp(resolve).render(true);
        })

        game.socket.emit("module.selectiveshowextended", { uuid: this.uuid, image: this.object, title: this.options.title, selection, type: "image" })
    }

    game.socket.on("module.selectiveshowextended", ({ id, mode, force, uuid, image, title, selection, type }) => {
        if (selection.includes(game.user.id)) {
            if (type === "journal") {
                Journal._showEntry(id, mode, force)
            }
            else if (type === "image") {
                ImagePopout._handleShareImage({ image, title, uuid })
            }
        }
    })

})


class SelectiveShowApp extends Application {

    constructor(resolve) {
        super();
        this.selection = resolve
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = "selective-show";
        options.template = "modules/selectiveshow/selectiveshow.html"
        options.classes.push("selective-show");
        options.height = 300;
        options.width = 250;
        options.minimizable = true;
        options.resizable = true;
        options.title = game.i18n.localize("selectiveshow.SelectiveShow")
        return options;
    }

    getData() {
        let data = super.getData();
        data.users = game.users.filter(u => u.active && u.data.id != game.user.id);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".show").click(ev => {
            ev.preventDefault();
            let selector = $(ev.currentTarget).parents("form").find("select");
            this.selection(selector.val());
            this.close();
        })
        html.find(".show-all").click(ev => {
            ev.preventDefault();
            this.selection(game.users.filter(u => u.active && u.data.id != game.user.id).map(u => u.id));
            this.close();
        })
    }
}
