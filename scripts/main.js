Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
    /* Only attach if this is a PC*/
	if (!["character", "PC", "Player", "npc", "pc"].includes(sheet.actor.type ?? sheet.actor.data.type)) return;

    buttons.unshift({
		label: game.i18n.localize(`pf2e-export-scribe.toolbar.title`),
		class: "export-scribe.pf2.tools",
		icon: "fas fa-file-code",
		onclick: () => {
			// Open Config window
            new ScribeFormApplication(sheet.actor).render(true);

			// Bring window to top
			Object.values(ui.windows)
				.filter(window => window instanceof ScribeFormApplication)[0]
				?.bringToTop();
		},
	});
});

class ScribeFormApplication extends FormApplication {
	constructor(actor) {
		super();
		this.actor = actor;
        console.group("PF2e Export to scribe.pf2.tools");
        console.debug("Loading dialog");
        console.debug("Actor Data:", this.actor);
        console.debug("Actor items:", this.actor.items);
        console.groupEnd();
	}

    static ID = "pf2e-export-scribe";

    static get defaultOptions() {

		return mergeObject(super.defaultOptions, {
			template: "modules/pf2e-export-scribe/templates/dialog.hbs",
			id: "pf2e-export-scribe",
			height: (window.innerHeight * 7) / 8,
			width: Math.max(window.innerWidth / 3, 600),
			resizable: true,
            title: game.i18n.localize(`pf2e-export-scribe.dialog.title`),
		});
	};

    activateListeners = function() {
		document.getElementById("pf2e-export-scribe-clipboard").addEventListener("click", event => {
			event.preventDefault();
            this.copy_to_clipboard();
            ui.notifications.info(
                "PF2e Export to scribe.pf2.tools | Markdown copied to clipboard."
            );

		});

    };

    copy_to_clipboard = function() {
        let md = document.getElementById("pf2e-export-scribe-features").innerHTML;
        navigator.clipboard.writeText(md);
    };

    getData = function() {
        let ancestry = new ScribeAncestry(this.actor.items.filter( i => i.type === 'ancestry')[0]);

        this.actor.items.filter(i => i.type === 'heritage')
            .forEach(
                (a) => {
                    ancestry.heritage(a);
                }
            );

        let ancestry_features = [];
        this.actor.items.filter( i => i.type === 'feat' && i.system.category === 'ancestryfeature')
            .sort( (a,b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)) )
            .forEach(
                (a) => {
                    let t = new ScribeFeature(a);
                    ancestry_features.push(t.scribify());
                }
            );


        let background = [];
        this.actor.items.filter( i => i.type === 'background')
            .forEach(
                (a) => {
                    let t = new ScribeBackground(a);
                    background.push(t.scribify());
                }
            );

        let classes = [];
        this.actor.items.filter( i => i.type === 'class')
            .forEach(
                (a) => {
                    let t = new ScribeClass(a);
                    classes.push(t.scribify());
                }
            );

        let class_features = [];
        this.actor.items.filter( i => i.type === 'feat' && (i.system.category === 'classfeature'))
            .sort( (a,b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)) )
            .forEach(
                (a) => {
                    let t = new ScribeFeature(a);
                    class_features.push(t.scribify());
                }
            );

        let feats = [];
        this.actor.items.filter( i => i.type === 'feat' && (i.system.category === 'skill' || i.system.category === 'general' || i.system.category === 'class'))
            .sort( (a,b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)) )
            .forEach(
                (a) => {
                    let t = new ScribeFeat(a);
                    feats.push(t.scribify());
                }
            );

        let spells = [];
        this.actor.items.filter( i => i.type === 'spell')
            .sort( (a,b) => (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)) )
            .forEach(
                (s) => {
                    let t = new ScribeSpell(s);
                    spells.push(t.scribify());
                }
            );
        return {
            ancestry: ancestry.scribify(),
            ancestry_features: ancestry_features.join('\n'),
            background: background.join('\n'),
            classes: classes.join('\n'),
            class_features: class_features.join('\n'),
            character_name: this.actor.name,
            feats: feats.join('\n'),
            spells: spells.join('\n'),
            title_features_feats_spells_formulas: game.i18n.localize(`pf2e-export-scribe.dialog.features_feats_spells_formulas`),
            generated_by: game.i18n.localize(`pf2e-export-scribe.dialog.generated_by`),
         }
    };

};

class ScribeBase {
    constructor(item) {
        this._item = item;
    };

    _cleanup = function(item) {
        if ( typeof(item) !== "string" ) {
            return item;
        }
        return item.split('\n').map(i => i.replace(/^\s+/,'')).join("\n") + '  \n';
    };

    /*
    scribify(template) {
        template = template.split('\n').map(i => i.replace(/^\s+/,'')).join("\n")
    };
    */

    _ucfirst = function(value) {
        /* Capitalize the given string */
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    _format_action = function(action) {
        let org_action = action;
        switch(action) {
            case "1":
                action = ":a:";
                break;
            case "2":
                action = ":aa:";
                break;
            case "3":
                action = ":aaa:";
                break;
            case "1 - 2":
            case "1 to 2":
                action = ":a: to :aa:";
                break;
            case "1 - 3":
            case "1 to 3":
                action = ":a: to :aaa:";
                break;
            case "r":
                action = ":r:";
                break;
            case "f":
                action = ":f:";
                break;
            default:
                action = org_action;
        };

        return action;
    };

    _format_traits = function(traitlist) {
        /* Format and order the traits acoording to the rules */
        if (typeof(traitlist) === "undefined") {
            return "";
        }
        traitlist = traitlist.filter(i => i !== "common" && i !== null && typeof(i) !== "undefined").map(i => i.toLowerCase());
        let tl = [];
        ["uncommon", "rare"].forEach(
            (el) => {
                if (traitlist.includes(el)) {
                    tl.push(this._ucfirst(el));
                    traitlist.splice(traitlist.indexOf(el),1);
                };
            }
        );
        ["lg","ln","le","ng","n","ne","cg","cn","ce"].forEach(
            (el) => {
                if (traitlist.includes(el)) {
                    tl.push(el.toLocaleUpperCase());
                    traitlist.splice(traitlist.indexOf(el),1);
                };
            }
        );
        ["tiny","small","medium","large","huge","gargantuan"].forEach(
            (el) => {
                if (traitlist.includes(el)) {
                    tl.push(this._ucfirst(el));
                    traitlist.splice(traitlist.indexOf(el),1);
                };
            }
        );
        tl = tl.concat(traitlist.map(i => this._ucfirst(i)).sort());
        return tl.join(", ");
    };

    _parse_description = function(value, buff_heading=0) {
        if (typeof(value) !== "string") {
            return value;
        }
        value = value.replace(/@UUID\[[^\]]+\.conditionitems\.[^\]]+\]{([^}]+)}/g,'*$1*');
        value = value.replace(/@UUID\[[^\]]+\.feats-srd\.[^\]]+\]{([^}]+)}/g,'*$1*');
        value = value.replace(/@UUID\[[^\]]+\.feat-effects\.[^\]]+\]{([^}]+)}/g,'*$1*');
        value = value.replace(/@UUID\[[^\]]+\.spells-srd\.[^\]]+\]{([^}]+)}/g,'*$1*');
        value = value.replace(/@UUID\[[^\]]+\.actionspf2e\.[^\]]+\]{([^}]+)}/g,'*$1*');
        value = value.replace(/@UUID\[[^\]]+\.spell-effects\.[^\]]+\]{([^}]+)}/g,'*$1*');
        value = value.replace(/@UUID\[[^\]]+\.classfeatures\.[^\]]+\]{([^}]+)}/g,'*$1*');


        value = value.replace(/\[\[\/r [^\]]+\]\]{([^}]+)}/g,'$1');
        value = value.replace(/@damage\[([^\[]+)\[([^\]]+)\]\]{([^}]+)}/gi, '$1 $2 ($3)')
        value = value.replace(/@damage\[([^\[]+)\[([^\]]+)\]\]/gi, '$1 $2');

        /* remove anything not needed */
        value = value.replace(/\[\[\/r[^}]+}/g, '');
        value = value.replace(/@check\[[^\]]+\]/gi, '');

        value = this._strip_html_element("br", value, '\n');
        value = this._strip_html_element("hr", value, '-');
        value = this._strip_html_element("p", value, '', '\n');
        value = this._strip_html_element("strong", value, '**', '**');
        value = this._strip_html_element("em", value, '*', '*');
        value = this._strip_html_element("span", value);
        value = this._strip_nested_html_element("ol", "li", value, '1. ', '\n')
        value = this._strip_html_element("ol", value);
        value = this._strip_nested_html_element("ul", "li", value, '- ', '\n')
        value = this._strip_html_element("ul", value);
        /*
        value = this._strip_html_element("li", value, '1. ', '\n');
        */
        buff_heading = buff_heading +1;
        value = this._strip_html_element("h1", value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element("h2", value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element("h3", value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element("h4", value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element("h5", value, '#'.repeat(buff_heading) + ' ', '\n');

        return value;
    };

    _strip_html_element = function(element, value, pre_replace='', post_replace='') {
        element = element.toLowerCase();
        if ( ['hr', 'br'].includes(element) ) {
            let re = new RegExp(`<${element} \/>`, 'gi');
            value = value.replace(re, pre_replace);
        } else {
            let pre = new RegExp(`<${element}[^>]*>`,'i');
            let post = new RegExp(`</${element}>`, 'i');
            while (true) {
                let ovalue = value;
                value = value.replace(pre, pre_replace);
                value = value.replace(post, post_replace);
                if (ovalue === value) {
                    break;
                };
            };
        ;}
        return value
    }

    _strip_nested_html_element = function(parent, element, value, pre_replace='', post_replace='') {
        let pre_parent = new RegExp(`<${parent}[^>]*>`, 'i');
        let post_parent = new RegExp(`</${parent}>`, 'i');
        let start_index = 0;
        while (true) {
            let ovalue = value;
            let search_value = value.substring(start_index);
            let pre_match = pre_parent.exec(search_value);
            let post_match = post_parent.exec(search_value);
            if (typeof(pre_match) === "object" && !pre_match) {
                break;
            };
            if (typeof(post_match) === "object" && !post_match) {
                break;
            };
            let snippet = search_value.substring((pre_match.index + pre_match[0].length), post_match.index);
            snippet = this._strip_html_element(element, snippet, pre_replace, post_replace);
            value = value.substring(0,start_index) + search_value.substring(0, pre_match.index + pre_match[0].length ) + snippet + search_value.substring(post_match.index);
            start_index = start_index + post_match.index + post_match[0].length;
            if (ovalue === value) {
                break;
            };
        }
        return value;
    };

};

class ScribeHeading extends ScribeBase {
    constructor(level=1, title="", heading="") {
        super();
        this._heading_level = level;
        this._heading_title = title;
        this._heading_description = heading;
    };

    scribify = function() {
        let heading = "";
        switch(this._heading_level) {
            case 1:
                heading = `
                head (
                # ${this._heading_title}
                ${this._heading_description}
                -
                )
                `;
                break;
            default:
                heading = `
                ${'#'.repeat(this._heading_level - 1)} ${this._heading_title}
                ${this._heading_description}
                `
        }
        return this._cleanup(heading);
    };
};

class ScribeWatermark extends ScribeBase {
    constructor(watermark) {
        super();
        this._watermark = watermark;
    };

    scribify = function() {
        let watermark = `
        watermark (
        ${this._watermark}
        )
        `;
        return this._cleanup(watermark);
    };
};

class ScribeItem extends ScribeBase {
    constructor(item) {
        super(item);
        this._item_title = "";
        this._item_type = "";
        this._item_rank = "";
        this._item_traits = [];
        this._item_description = [];
        this._section = [];
    };

    _scribify() {
        let description = this._item_description.join('\n-\n');
        let traits = this._format_traits(this._item_traits);
        let item = 'item(\n';
        item = item + `# ${this._item_title}\n`;
        if ( this._item_rank !== "" ) {
            item = item + `## ${this._item_type} ${this._item_rank}\n`;
        } else {
            item = item + `## ${this._item_type}\n`;
        }
        item = item + '-\n';
        if ( traits !== "" ) {
            item = item + `; ${traits}\n`;
        };
        item = item + `${description}\n`;
        item = item + ')\n';
        return this._cleanup(item);
    };

    scribify = function() {
        this._item_title = this._item.name;
        this._item_type = this._item.type;
        this._item_rank = this._item.system.level?.value;
        this._item_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
        return this._scribify();
    }

    section() {
        /* Start Section */
    };

    end_section() {
        /* end of the section */
    };
};

class ScribeAncestry extends ScribeBase {
    constructor(item) {
        super(item);
        this._ancestry_title = "";
        this._ancestry_type = "ancestry";
        this._heritage = [];
        this._ancestry_traits = [];
        this._ancestry_description = [];
    }

    heritage = function(heritage) {
        this._heritage.push(heritage);
    };

    _scribify = function() {
        let ret = "";
        let traits = this._ancestry_traits;
        this._heritage.forEach(
            (i) => {
                traits = traits.concat(i.system.traits.value.concat([i.system.traits.rarity]));
            }
        );
        traits = this._format_traits(traits);
        ret = ret + `# Ancestry: ${this._ancestry_title}\n`;
        ret = ret + `-\n`;
        if ( traits !== "" ) {
            ret = ret + `; ${traits}\n`;
        };
        ret = ret + `${this._ancestry_description.join('\n')}`
        if (this._heritage.length > 0) {
            this._heritage.forEach(
                (i) => {
                    ret = ret + `## Heritage: ${i.name}\n`;
                    ret = ret + `${i.system.description.value}\n`;
                }
            );
        }
        return this._cleanup(ret);
    };

    scribify = function() {
        this._ancestry_title = this._item.name;
        this._ancestry_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        this._ancestry_description.push(this._parse_description(this._item.system.description?.value || ''));
        return this._scribify();
    }

}

class ScribeBackground extends ScribeItem {
    scribify = function() {
        this._item_title = this._item.name;
        this._item_type = this._item.type;
        this._item_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
        return this._scribify();
    };
};

class ScribeClass extends ScribeBase {
    constructor(item) {
        super(item);
        this._class_name = "";
        this._class_description = "";
    };

    _scribify = function() {
        let ret = [];
        ret.push(`# Class: ${this._class_name}`)

        let pre = new RegExp(`<span[^>]+style="float:right"[^>]*>`,'i');
        let post = new RegExp(`</span>`, 'i');
        while (true) {
            let ovalue = this._class_description;
            this._class_description = this._class_description.replace(pre, ' (');
            if (ovalue === this._class_description) {
                break;
            };
            this._class_description = this._class_description.replace(post, ')');
            if (ovalue === this._class_description) {
                break;
            };
        };

        ret.push(this._parse_description(this._class_description, 1));

        /* ret.push(this._class_description, 1); */
        return this._cleanup(ret.join('\n'));
    };

    scribify = function() {
        this._class_name = this._item.name;
        /*
        this._item_type = this._item.type;
        this._item_rank = this._item.system.level?.value;
        this._item_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        */
        this._class_description = this._item.system.description?.value;
        return this._scribify();
    }
}

class ScribeFeature extends ScribeItem {
    scribify = function() {
        this._item_title = this._item.name;
        this._item_type = "";
        if ( this._item.system.level?.value > 0 ) {
            this._item_rank = this._item.system.level?.value;
        }
        this._item_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
        return this._scribify();
    }

};

class ScribeFeat extends ScribeItem {
    scribify = function() {
        if (this._item.system.actionType.value === "reaction") {
            this._item_title = this._item.name + ' :r:';
        } else {
            this._item_title = this._item.name;
        }
        this._item_type = this._item.type;
        this._item_rank = this._item.system.level?.value;
        this._item_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        let prerequisites = [];
        this._item.system.prerequisites.value.forEach(
            (i) => {
                prerequisites.push(i.value);
            }
        );
        if (prerequisites.length > 0) {
            this._item_description.push(`**Prerequisites** ${prerequisites.join(', ')}`);
        }
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
        return this._scribify();
    }
}

class ScribeSpell extends ScribeItem {

    scribify = function() {
        let actions= "";
        let cast = "";
        if ( ! isNaN(parseInt(this._item.system.time.value)) ) {
            actions = this._format_action(this._item.system.time.value);
            if ( actions === this._item.system.time.value ) {
                cast = `**Cast** ${actions}\n`;
                actions = "";
            };
        }
        this._item_title = `${this._item.name} ${actions}`;

        if (this._item.isCantrip) {
            this._item_type = "cantrip";
        } else if (this._item.isFocusSpell ) {
            this._item_type = "focus";
        } else {
            this._item_type = "spell";
        };

        this._item_rank = this._item.system.level.value;
        this._item_traits = this._item.system.traits.value.concat([this._item.system.traits.rarity]);

        let first = [];
        if (this._item.system.traits.traditions.length > 0) {
            first.push(`**Tradition** ${this._item.system.traits.traditions.join(', ')}\n`);
        };
        if ( cast !== "") {
            first.push(cast);
        };

        /* Range, Area, Targets */
        let rat = [];
        if ( !(typeof(this._item.system.range) === "object" && !this._item.system.range) ) {
            if ( this._item.system.range.value !== "" ) {
                rat.push(`**Range** ${this._item.system.range.value}`);
            };
        };
        if ( !(typeof(this._item.system.area) === "object" && !this._item.system.area) ) {
            if ( this._item.system.area.value !== "" ) {
                rat.push(`**Area** ${this._item.system.area.value}ft ${this._item.system.area.type}`);
            };
        };
        if ( !(typeof(this._item.system.target) === "object" && !this._item.system.target) && this._item.system.target != "") {
            if (this._item.system.target.value !== "") {
                rat.push(`**Targets** ${this._item.system.target.value}`);
            }
        };
        if (rat.length > 0) {
            first.push(rat.join("; ") + '\n');
        }

        /* Defense, Duration */
        let dd = [];
        if ( !(typeof(this._item.system.defense) === "object" && !this._item.system.defense) ) {
            if ( (typeof(this._item.system.defense.passive) === "object" && !this._item.system.defense.passive )) {
                if ( this._item.system.defense.passive.statistic !== "" ) {
                    dd.push(`**Defense** ${this._item.system.defense.passive.statistic}`);
                }
            };
        };
        if ( !(typeof(this._item.system.duration) === "object" && !this._item.system.duration) ) {
            if ( this._item.system.duration.value != "" ) {
                let duration = `**Duration** ${this._item.system.duration.value}`;
                if ( this._item.system.duration.sustained ) {
                    duration = `${duration} (Sustained)`
                }
                dd.push(duration);
            }
        };
        if (dd.length > 0) {
            first.push(dd.join("; ") + '\n');
        };

        this._item_description.push(first.join('\n'));

        this._item_description.push(this._parse_description(this._item.system.description.value));
        let trigger = "";
        return this._scribify();
        /* return this._scribify(); */

    }

};