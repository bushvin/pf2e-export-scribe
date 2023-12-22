Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
    /* Only attach if this is a PC*/
    if (!['character', 'PC', 'Player', 'npc', 'pc'].includes(sheet.actor.type ?? sheet.actor.data.type)) return;

    buttons.unshift({
        label: game.i18n.localize(`pf2e-export-scribe.toolbar.title`),
        class: 'export-scribe.pf2.tools',
        icon: 'fas fa-file-code',
        onclick: () => {
            // Open Config window
            new ScribeFormApplication(sheet.actor).render(true);

            // Bring window to top
            Object.values(ui.windows)
                .filter((window) => window instanceof ScribeFormApplication)[0]
                ?.bringToTop();
        },
    });
});

class ScribeFormApplication extends FormApplication {
    constructor(actor) {
        super();
        this.actor = actor;
        console.debug('PF2e Export to scribe.pf2.tools | Loading dialog');
        console.debug('PF2e Export to scribe.pf2.tools | actor', actor);
    }

    static ID = 'pf2e-export-scribe';

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: 'modules/pf2e-export-scribe/templates/dialog.hbs',
            id: 'pf2e-export-scribe',
            height: (window.innerHeight * 7) / 8,
            width: Math.max(window.innerWidth / 3, 600),
            resizable: true,
            title: game.i18n.localize(`pf2e-export-scribe.dialog.title`),
        });
    }

    activateListeners = function () {
        document.getElementById('pf2e-export-scribe-clipboard').addEventListener('click', (event) => {
            event.preventDefault();
            this.copy_to_clipboard();
            ui.notifications.info('PF2e Export to scribe.pf2.tools | Markdown copied to clipboard.');
        });
        document.getElementById('pf2e-export-scribe-include-ancestry').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-ancestry-features').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-class').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-background').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-class-features').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-feats').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-spells').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        document.getElementById('pf2e-export-scribe-include-formulas').addEventListener('change', (event) => {
            event.preventDefault();
            this.update_export();
        });
        this.update_export();
    };

    copy_to_clipboard = function () {
        let md = document.getElementById('pf2e-export-scribe-features').textContent;
        navigator.clipboard.writeText(md);
    };

    update_export = function () {
        let md = ['watermark (', 'Generated by pf2e-export-scribe', ')', ''];
        if (
            document.getElementById('pf2e-export-scribe-include-ancestry').checked &&
            document.getElementById('pf2e-export-scribe-content-ancestry').textContent.replace(/\s+/, '') != ''
        ) {
            md.push(document.getElementById('pf2e-export-scribe-content-ancestry').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-ancestry-features').checked &&
            document.getElementById('pf2e-export-scribe-content-ancestry-features').textContent.replace(/\s+/, '') != ''
        ) {
            md.push('## Ancestry Features ((+Ancestry Features))');
            md.push(document.getElementById('pf2e-export-scribe-content-ancestry-features').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-background').checked &&
            document.getElementById('pf2e-export-scribe-content-background').textContent.replace(/\s+/, '') != ''
        ) {
            md.push(document.getElementById('pf2e-export-scribe-content-background').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-class').checked &&
            document.getElementById('pf2e-export-scribe-content-class').textContent.replace(/\s+/, '') != ''
        ) {
            md.push(document.getElementById('pf2e-export-scribe-content-class').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-class-features').checked &&
            document.getElementById('pf2e-export-scribe-content-class-features').textContent.replace(/\s+/, '') != ''
        ) {
            md.push('## Class features ((+Class features))');
            md.push(document.getElementById('pf2e-export-scribe-content-class-features').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-feats').checked &&
            document.getElementById('pf2e-export-scribe-content-feats').textContent.replace(/\s+/, '') != ''
        ) {
            md.push('# Feats ((Feats))');
            md.push(document.getElementById('pf2e-export-scribe-content-feats').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-spells').checked &&
            document.getElementById('pf2e-export-scribe-content-spells').textContent.replace(/\s+/, '') != ''
        ) {
            md.push('# Spells ((Spells))');
            md.push(document.getElementById('pf2e-export-scribe-content-spells').textContent);
            md.push('');
        }
        if (
            document.getElementById('pf2e-export-scribe-include-formulas').checked &&
            document.getElementById('pf2e-export-scribe-content-formulas').textContent.replace(/\s+/, '') != ''
        ) {
            md.push('# Formulas ((Formulas))');
            md.push(document.getElementById('pf2e-export-scribe-content-formulas').textContent);
            md.push('');
        }
        document.getElementById('pf2e-export-scribe-features').textContent = md.join('\n');
    };

    getData = function () {
        let ancestry = new ScribeAncestry(this.actor.items.filter((i) => i.type === 'ancestry')[0]);
        this.actor.items
            .filter((i) => i.type === 'heritage')
            .forEach((a) => {
                ancestry.heritage(a);
            });

        let ancestry_features = [];
        this.actor.items
            .filter((i) => i.type === 'feat' && i.system.category === 'ancestryfeature')
            .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
            .forEach((a) => {
                let t = new ScribeFeature(a, 2);
                ancestry_features.push(t.scribify());
            });

        let background = [];
        this.actor.items
            .filter((i) => i.type === 'background')
            .forEach((a) => {
                let t = new ScribeBackground(a);
                background.push(t.scribify());
            });

        let classes = [];
        this.actor.items
            .filter((i) => i.type === 'class')
            .forEach((a) => {
                let t = new ScribeClass(a);
                classes.push(t.scribify());
            });

        let class_features = [];
        this.actor.items
            .filter((i) => i.type === 'feat' && i.system.category === 'classfeature')
            .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
            .forEach((a) => {
                let t = new ScribeFeature(a, 2);
                class_features.push(t.scribify());
            });

        let feats = [];
        this.actor.items
            .filter(
                (i) =>
                    i.type === 'feat' &&
                    (i.system.category === 'skill' || i.system.category === 'general' || i.system.category === 'class')
            )
            .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
            .forEach((a) => {
                let t = new ScribeFeat(a, 1);
                feats.push(t.scribify());
            });

        let spells = [];
        this.actor.items
            .filter((i) => i.type === 'spell')
            .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
            .forEach((s) => {
                let t = new ScribeSpell(s, 1);
                spells.push(t.scribify());
            });
        let formulas = [];
        this.actor.system.crafting.formulas
            .map((i) => fromUuidSync(i.uuid))
            .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
            .forEach((f) => {
                let t = new ScribeFormula(f, 1);
                formulas.push(t.scribify());
            });

        return {
            ancestry: ancestry.scribify(),
            ancestry_features: ancestry_features.join('\n'),
            background: background.join('\n'),
            classes: classes.join('\n'),
            class_features: class_features.join('\n'),
            character_name: this.actor.name,
            feats: feats.join('\n'),
            formulas: formulas.join('\n'),
            spells: spells.join('\n'),
            title_features_feats_spells_formulas: game.i18n.localize(
                `pf2e-export-scribe.dialog.features_feats_spells_formulas`
            ),
            generated_by: game.i18n.localize(`pf2e-export-scribe.dialog.generated_by`),
        };
    };
}

class ScribeBase {
    constructor(item) {
        this._item = item;
    }

    _label(label, level) {
        return '((' + '+'.repeat(level) + label + ' ))';
    }

    _cleanup = function (item) {
        if (typeof item !== 'string') {
            return item;
        }
        return (
            item
                .split('\n')
                .map((i) => i.replace(/^\s+/, ''))
                .join('\n') + '  \n'
        );
    };

    _ucfirst = function (value) {
        /* Capitalize the given string */
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    };

    _format_action = function (action) {
        let org_action = action;
        switch (action) {
            case '1':
                action = ':a:';
                break;
            case '2':
                action = ':aa:';
                break;
            case '3':
                action = ':aaa:';
                break;
            case '1 - 2':
            case '1 to 2':
                action = ':a: to :aa:';
                break;
            case '1 - 3':
            case '1 to 3':
                action = ':a: to :aaa:';
                break;
            case 'r':
            case 'reaction':
                action = ':r:';
                break;
            case 'f':
                action = ':f:';
                break;
            default:
                action = org_action;
        }

        return action;
    };

    _format_traits = function (traitlist) {
        /* Format and order the traits acoording to the rules */
        if (typeof traitlist === 'undefined') {
            return '';
        }
        traitlist = traitlist
            .filter((i) => i !== 'common' && i !== null && typeof i !== 'undefined')
            .map((i) => i.toLowerCase());
        let tl = [];
        ['uncommon', 'rare'].forEach((el) => {
            if (traitlist.includes(el)) {
                tl.push(this._ucfirst(el));
                traitlist.splice(traitlist.indexOf(el), 1);
            }
        });
        ['lg', 'ln', 'le', 'ng', 'n', 'ne', 'cg', 'cn', 'ce'].forEach((el) => {
            if (traitlist.includes(el)) {
                tl.push(el.toLocaleUpperCase());
                traitlist.splice(traitlist.indexOf(el), 1);
            }
        });
        ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'].forEach((el) => {
            if (traitlist.includes(el)) {
                tl.push(this._ucfirst(el));
                traitlist.splice(traitlist.indexOf(el), 1);
            }
        });
        tl = tl.concat(traitlist.map((i) => this._ucfirst(i)).sort());
        return tl.join(', ');
    };

    _parse_description = function (value, buff_heading = 0) {
        if (typeof value !== 'string') {
            return value;
        }
        value = value.replace(/@UUID\[[^\]]+\.conditionitems\.[^\]]+\]{([^}]+)}/g, '*$1*');
        value = value.replace(/@UUID\[[^\]]+\.feats-srd\.[^\]]+\]{([^}]+)}/g, '*$1*');
        value = value.replace(/@UUID\[[^\]]+\.feat-effects\.[^\]]+\]{([^}]+)}/g, '*$1*');
        value = value.replace(/@UUID\[[^\]]+\.spells-srd\.[^\]]+\]{([^}]+)}/g, '*$1*');
        value = value.replace(/@UUID\[[^\]]+\.actionspf2e\.[^\]]+\]{([^}]+)}/g, '*$1*');
        value = value.replace(/@UUID\[[^\]]+\.spell-effects\.[^\]]+\]{([^}]+)}/g, '*$1*');
        value = value.replace(/@UUID\[[^\]]+\.classfeatures\.[^\]]+\]{([^}]+)}/g, '*$1*');

        value = value.replace(/\[\[\/r [^\]]+\]\]{([^}]+)}/g, '$1');
        value = value.replace(/\[\[\/r [0-9]+d[0-9]+\[[^\]]+\]\]\]{([^}]+)}/g, '$1');
        value = value.replace(/@damage\[([^\[]+)\[([^\]]+)\]\]{([^}]+)}/gi, '$1 $2 ($3)');
        value = value.replace(/@damage\[([^\[]+)\[([^\]]+)\]\]/gi, '$1 $2');

        /* remove anything not needed */
        value = value.replace(/\[\[\/r[^}]+}/g, '');
        value = value.replace(/@check\[[^\]]+\]/gi, '');

        value = this._strip_html_element('br', value, '\n');
        value = this._strip_html_element('hr', value, '-');
        value = this._strip_html_element('p', value, '', '\n');
        value = this._strip_html_element('strong', value, '**', '**');
        value = this._strip_html_element('em', value, '*', '*');
        value = this._strip_html_element('span', value);
        value = this._strip_nested_html_element('ol', 'li', value, '1. ', '\n');
        value = this._strip_html_element('ol', value);
        value = this._strip_nested_html_element('ul', 'li', value, '- ', '\n');
        value = this._strip_html_element('ul', value);
        /*
        value = this._strip_html_element("li", value, '1. ', '\n');
        */
        buff_heading = buff_heading + 1;
        value = this._strip_html_element('h1', value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element('h2', value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element('h3', value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element('h4', value, '#'.repeat(buff_heading) + ' ', '\n');
        value = this._strip_html_element('h5', value, '#'.repeat(buff_heading) + ' ', '\n');

        return value;
    };

    _strip_html_element = function (element, value, pre_replace = '', post_replace = '') {
        element = element.toLowerCase();
        if (['hr', 'br'].includes(element)) {
            let re = new RegExp(`<${element} \/>`, 'gi');
            value = value.replace(re, pre_replace);
        } else {
            let pre = new RegExp(`<${element}[^>]*>`, 'i');
            let post = new RegExp(`</${element}>`, 'i');
            while (true) {
                let ovalue = value;
                value = value.replace(pre, pre_replace);
                value = value.replace(post, post_replace);
                if (ovalue === value) {
                    break;
                }
            }
        }
        return value;
    };

    _strip_nested_html_element = function (parent, element, value, pre_replace = '', post_replace = '') {
        let pre_parent = new RegExp(`<${parent}[^>]*>`, 'i');
        let post_parent = new RegExp(`</${parent}>`, 'i');
        let start_index = 0;
        while (true) {
            let ovalue = value;
            let search_value = value.substring(start_index);
            let pre_match = pre_parent.exec(search_value);
            let post_match = post_parent.exec(search_value);
            if (typeof pre_match === 'object' && !pre_match) {
                break;
            }
            if (typeof post_match === 'object' && !post_match) {
                break;
            }
            let snippet = search_value.substring(pre_match.index + pre_match[0].length, post_match.index);
            snippet = this._strip_html_element(element, snippet, pre_replace, post_replace);
            value =
                value.substring(0, start_index) +
                search_value.substring(0, pre_match.index + pre_match[0].length) +
                snippet +
                search_value.substring(post_match.index);
            start_index = start_index + post_match.index + post_match[0].length;
            if (ovalue === value) {
                break;
            }
        }
        return value;
    };
}

class ScribeHeading extends ScribeBase {
    constructor(level = 1, title = '', heading = '') {
        super();
        this._heading_level = level;
        this._heading_title = title;
        this._heading_description = heading;
    }

    scribify() {
        let heading = '';
        switch (this._heading_level) {
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
                `;
        }
        return this._cleanup(heading);
    }
}

class ScribeItem extends ScribeBase {
    constructor(item, label_level = 0) {
        super(item);
        this._item_title = this._item.name;
        this._item_label = this._item.name;
        this._item_type = this._item.type;
        this._item_rank = this._item.system.level?.value;
        this._item_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        this._item_source = this._item.system.publication.title;
        this._item_description = [];
        this._section = [];
        this._label_level = label_level;
    }

    scribify() {
        let description = this._item_description.join('\n-\n');
        let traits = this._format_traits(this._item_traits);

        let item = 'item(\n';
        item = item + `# ${this._item_title} ${this._label(this._item_label, this._label_level)}\n`;
        if (this._item_rank !== '') {
            item = item + `## ${this._item_type} ${this._item_rank}\n`;
        } else {
            item = item + `## ${this._item_type}\n`;
        }
        item = item + '-\n';
        if (traits !== '') {
            item = item + `; ${traits}\n`;
        }
        if (this._item_source.trim() != '') {
            item = item + `**Source** ${this._item_source}\n\n`;
        }
        item = item + `${description}\n\n`;
        item = item + ')\n';
        return this._cleanup(item);
    }
}

class ScribeAncestry extends ScribeBase {
    constructor(item, label_level = 0) {
        super(item);
        this._ancestry_title = '';
        this._ancestry_type = 'ancestry';
        this._heritage = [];
        this._ancestry_traits = [];
        this._ancestry_description = [];
        this._ancestry_title = this._item.name;
        this._ancestry_traits = this._item.system.traits?.value.concat([this._item.system.traits?.rarity]) || [];
        this._ancestry_description.push(this._parse_description(this._item.system.description?.value || ''));
        this._item_label = this._item.name;
        this._label_level = label_level;
    }

    heritage = function (heritage) {
        this._heritage.push(heritage);
    };

    scribify() {
        let ret = '';
        let traits = this._ancestry_traits;
        this._heritage.forEach((i) => {
            traits = traits.concat(i.system.traits.value.concat([i.system.traits.rarity]));
        });
        traits = this._format_traits(traits);
        ret = ret + `# Ancestry: ${this._ancestry_title} ${this._label(this._ancestry_title, this._label_level)}\n`;
        ret = ret + `-\n`;
        if (traits !== '') {
            ret = ret + `; ${traits}\n`;
        }
        ret = ret + `${this._ancestry_description.join('\n')}`;
        if (this._heritage.length > 0) {
            this._heritage.forEach((i) => {
                ret = ret + `## Heritage: ${i.name}  ${this._label(i.name, this._label_level + 1)}\n`;
                ret = ret + `${i.system.description.value}\n`;
            });
        }
        return this._cleanup(ret);
    }
}

class ScribeBackground extends ScribeItem {
    constructor(item) {
        super(item);
        this._item_rank = '';
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
    }
}

class ScribeClass extends ScribeBase {
    constructor(item, label_level = 0) {
        super(item);
        this._class_name = this._item.name;
        this._class_label = this._item.name;
        this._class_description = this._item.system.description?.value;
        this._label_level = label_level;
    }

    scribify() {
        let ret = [];
        ret.push(`# Class: ${this._class_name} ${this._label(this._class_label, this._label_level)}`);

        let pre = new RegExp(`<span[^>]+style="float:right"[^>]*>`, 'i');
        let post = new RegExp(`</span>`, 'i');
        while (true) {
            let ovalue = this._class_description;
            this._class_description = this._class_description.replace(pre, ' (');
            if (ovalue === this._class_description) {
                break;
            }
            this._class_description = this._class_description.replace(post, ')');
            if (ovalue === this._class_description) {
                break;
            }
        }

        ret.push(this._parse_description(this._class_description, 1));

        /* ret.push(this._class_description, 1); */
        return this._cleanup(ret.join('\n'));
    }
}

class ScribeFeature extends ScribeItem {
    constructor(item, label_level = 0) {
        super(item, label_level);
        this._item_type = '';
        // this._label_level = label_level;

        if (this._item.system.level?.value == 0) {
            this._item_rank = '';
        }
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
    }
}

class ScribeFeat extends ScribeItem {
    constructor(item, label_level = 0) {
        super(item, label_level);
        if (this._item.system.actionType.value === 'reaction') {
            this._item_title = `${this._item_title} :r:`;
        }
        let prerequisites = [];
        this._item.system.prerequisites.value.forEach((i) => {
            prerequisites.push(i.value);
        });
        if (prerequisites.length > 0) {
            this._item_description.push(`**Prerequisites** ${prerequisites.join(', ')}`);
        }
        this._item_description.push(this._parse_description(this._item.system.description?.value || ''));
    }
}

class ScribeSpell extends ScribeItem {
    constructor(item, label_level = 0) {
        super(item, label_level);
        let actions = '';
        let cast = '';
        actions = this._format_action(this._item.system.time.value);
        if (actions === this._item.system.time.value) {
            cast = `**Cast** ${actions}\n`;
            actions = '';
        }
        this._item_title = `${this._item.name} ${actions}`;

        if (this._item.isCantrip) {
            this._item_type = 'cantrip';
        } else if (this._item.isFocusSpell) {
            this._item_type = 'focus';
        } else {
            this._item_type = 'spell';
        }

        let first = [];
        if (this._item.system.traits.traditions.length > 0) {
            first.push(`**Tradition** ${this._item.system.traits.traditions.join(', ')}\n`);
        }
        if (cast !== '') {
            first.push(cast);
        }

        /* Range, Area, Targets */
        let rat = [];
        if (!(typeof this._item.system.range === 'object' && !this._item.system.range)) {
            if (this._item.system.range.value !== '') {
                rat.push(`**Range** ${this._item.system.range.value}`);
            }
        }
        if (!(typeof this._item.system.area === 'object' && !this._item.system.area)) {
            if (this._item.system.area.value !== '') {
                rat.push(`**Area** ${this._item.system.area.value}ft ${this._item.system.area.type}`);
            }
        }
        if (
            !(typeof this._item.system.target === 'object' && !this._item.system.target) &&
            this._item.system.target != ''
        ) {
            if (this._item.system.target.value !== '') {
                rat.push(`**Targets** ${this._item.system.target.value}`);
            }
        }
        if (rat.length > 0) {
            first.push(rat.join('; ') + '\n');
        }

        /* Defense, Duration */
        let dd = [];
        if (!(typeof this._item.system.defense === 'object' && !this._item.system.defense)) {
            if (typeof this._item.system.defense.passive === 'object' && !this._item.system.defense.passive) {
                if (this._item.system.defense.passive.statistic !== '') {
                    dd.push(`**Defense** ${this._item.system.defense.passive.statistic}`);
                }
            }
        }
        if (!(typeof this._item.system.duration === 'object' && !this._item.system.duration)) {
            if (this._item.system.duration.value != '') {
                let duration = `**Duration** ${this._item.system.duration.value}`;
                if (this._item.system.duration.sustained) {
                    duration = `${duration} (Sustained)`;
                }
                dd.push(duration);
            }
        }
        if (dd.length > 0) {
            first.push(dd.join('; ') + '\n');
        }

        this._item_description.push(first.join('\n'));

        this._item_description.push(this._parse_description(this._item.system.description.value));
    }
}

class ScribeFormula extends ScribeItem {
    constructor(item, label_level = 0) {
        super(item, label_level);
        this._formula_cost_table = [
            '5 sp',
            '1 gp',
            '2 gp',
            '3 gp',
            '5 gp',
            '8 gp',
            '13 gp',
            '18 gp',
            '25 gp',
            '35 gp',
            '50 gp',
            '70 gp',
            '100 gp',
            '150 gp',
            '225 gp',
            '325 gp',
            '500 gp',
            '750 gp',
            '1,200 gp',
            '2,000 gp',
            '3,500 gp',
        ];
        this._item_rank = this._item.level;
        this._item_type = 'formula';
        this._item_description.push(`**Cost** ${this._formula_cost_table[this._item.level]}`);
        this._item_description.push(this._parse_description(this._item.description));
    }
}
