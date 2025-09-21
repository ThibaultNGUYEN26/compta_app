from pathlib import Path
from tkinter import Button, Canvas, Entry, Frame, Label, PhotoImage, StringVar, Tk, TclError
from tkinter import ttk
from tkinter import font as tkfont

ICON_SUBSAMPLE = 2
ENTRY_NAMES = ["Date", "Montant", "Catégorie"]
CATEGORY_VALUES = [
    "Loyer",
    "Courses",
    "Loisirs",
    "Transport",
    "Santé",
    "Abonnements",
    "Restaurants",
    "Cadeaux",
    "Épargne",
    "Salaire",
    "Remboursement",
    "Autre",
]
FONT_MIN_SIZE = 10
FONT_MAX_SIZE = 18
FONT_SCALE_DIVISOR = 35
FONT_FAMILY = "Segoe UI"

LIGHT_THEME = {
    "bg": "#f0f0f0",
    "fg": "#333333",
    "entry_bg": "#ffffff",
    "entry_fg": "#333333",
    "entry_border": "#cccccc",
    "toggle_track": "#d0d0d0",
    "toggle_track_active": "#4caf50",
    "toggle_thumb": "#ffffff",
}

DARK_THEME = {
    "bg": "#2e2e2e",
    "fg": "#f0f0f0",
    "entry_bg": "#3a3a3a",
    "entry_fg": "#f0f0f0",
    "entry_border": "#5a5a5a",
    "toggle_track": "#555555",
    "toggle_track_active": "#66bb6a",
    "toggle_thumb": "#e0e0e0",
}


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("Compta App")

        width_size = self.root.winfo_screenwidth()
        height_size = self.root.winfo_screenheight()
        self.root.geometry(f"{width_size // 2}x{height_size // 2}")
        self.root.minsize(400, 300)

        asset_dir = Path(__file__).resolve().parent / "src"
        dark_icon = PhotoImage(master=self.root, file=str(asset_dir / "dark_mode_icon.png"))
        light_icon = PhotoImage(master=self.root, file=str(asset_dir / "light_mode_icon.png"))

        self.dark_mode_icon = dark_icon.subsample(ICON_SUBSAMPLE, ICON_SUBSAMPLE)
        self.light_mode_icon = light_icon.subsample(ICON_SUBSAMPLE, ICON_SUBSAMPLE)

        self.is_dark_mode = False
        self.current_theme = LIGHT_THEME

        self.label_font = tkfont.Font(family=FONT_FAMILY, size=FONT_MIN_SIZE)
        self.entry_font = tkfont.Font(family=FONT_FAMILY, size=FONT_MIN_SIZE)

        self.style = ttk.Style(self.root)
        try:
            self.style.theme_use("clam")
        except TclError:
            pass
        self.combobox_style = "App.TCombobox"

        self.labels = []
        self.entries = []
        self.columns = []
        self.category_var = StringVar()
        self.category_combobox = None
        self.montant_var = StringVar()
        self.amount_validator = self.root.register(self._validate_amount)
        self.transaction_is_entry = False
        self.transaction_container = None
        self.montant_container = None

        self.header_frame = Frame(self.root, bg=LIGHT_THEME["bg"])
        self.header_frame.pack(fill="x", padx=40, pady=(20, 0))

        self.toggle_button = Button(
            self.header_frame,
            command=self.toggle_theme,
            highlightthickness=0,
            borderwidth=0,
            relief="flat",
            bg=LIGHT_THEME["bg"],
            activebackground=LIGHT_THEME["bg"],
        )
        self.toggle_button.pack(anchor="center", pady=(0, 10))

        self.entry_frame = Frame(self.root, bg=LIGHT_THEME["bg"])
        self.entry_frame.pack(expand=True, fill="x", padx=40, pady=20)

        for name in ENTRY_NAMES:
            column = Frame(self.entry_frame, bg=LIGHT_THEME["bg"])
            column.pack(side="left", expand=True, fill="x", padx=10)
            self.columns.append(column)

            label = Label(
                column,
                text=name,
                anchor="center",
                pady=4,
                bg=LIGHT_THEME["bg"],
                fg=LIGHT_THEME["fg"],
                font=self.label_font,
            )
            label.pack(fill="x")
            self.labels.append(label)

            if name == "Catégorie":
                combobox = ttk.Combobox(
                    column,
                    textvariable=self.category_var,
                    values=CATEGORY_VALUES,
                    state="readonly",
                    style=self.combobox_style,
                    exportselection=False,
                )
                combobox.pack(expand=True, fill="x", pady=(4, 8))
                combobox.configure(font=self.entry_font)
                combobox.bind("<<ComboboxSelected>>", self._clear_category_selection)
                combobox.bind("<FocusOut>", self._clear_category_selection)
                self.category_combobox = combobox
            elif name == "Montant":
                montant_container = Frame(column, bg=LIGHT_THEME["bg"])
                montant_container.pack(expand=True, fill="x", pady=(4, 8))
                self.montant_container = montant_container

                entry = Entry(
                    montant_container,
                    textvariable=self.montant_var,
                    justify="center",
                    relief="flat",
                    highlightthickness=1,
                    font=self.entry_font,
                    exportselection=False,
                    validate="key",
                    validatecommand=(self.amount_validator, "%P"),
                )
                entry.pack(expand=True, fill="x", ipady=4)
                self.entries.append(entry)

                toggle_container = Frame(montant_container, bg=LIGHT_THEME["bg"])
                toggle_container.pack(anchor="center", pady=(6, 0))
                self.transaction_container = toggle_container

                self.transaction_label = Label(
                    toggle_container,
                    text="Sortie",
                    bg=LIGHT_THEME["bg"],
                    fg=LIGHT_THEME["fg"],
                    font=self.label_font,
                )
                self.transaction_label.pack(side="left", padx=(0, 6))
                self.transaction_label.bind("<Button-1>", self._on_transaction_toggle)
                self.labels.append(self.transaction_label)

                self.transaction_canvas = Canvas(
                    toggle_container,
                    width=54,
                    height=28,
                    bd=0,
                    highlightthickness=0,
                    relief="flat",
                    bg=LIGHT_THEME["bg"],
                )
                self.transaction_canvas.pack(side="left", padx=(8, 0))
                self.transaction_canvas.bind("<Button-1>", self._on_transaction_toggle)
            else:
                entry = Entry(
                    column,
                    justify="center",
                    relief="flat",
                    highlightthickness=1,
                    font=self.entry_font,
                    exportselection=False,
                )
                entry.pack(expand=True, fill="x", pady=(4, 8), ipady=4)
                self.entries.append(entry)

        self.toggle_button.configure(image=self.dark_mode_icon)

        self.apply_theme()
        self._update_fonts()
        self._clear_category_selection()
        self._render_transaction_toggle(LIGHT_THEME)
        self.root.bind("<Configure>", self._on_resize)

    def apply_theme(self):
        theme = DARK_THEME if self.is_dark_mode else LIGHT_THEME
        self.current_theme = theme
        self.root.configure(bg=theme["bg"])
        self.header_frame.configure(bg=theme["bg"])
        self.toggle_button.configure(
            image=self.light_mode_icon if self.is_dark_mode else self.dark_mode_icon,
            bg=theme["bg"],
            activebackground=theme["bg"],
        )
        self.entry_frame.configure(bg=theme["bg"])
        for column in self.columns:
            column.configure(bg=theme["bg"])
        for label in self.labels:
            label.configure(bg=theme["bg"], fg=theme["fg"])
        for entry in self.entries:
            entry.configure(
                bg=theme["entry_bg"],
                fg=theme["entry_fg"],
                insertbackground=theme["entry_fg"],
                highlightbackground=theme["entry_border"],
                highlightcolor=theme["entry_border"],
            )
        if self.category_combobox is not None:
            self.style.configure(
                self.combobox_style,
                foreground=theme["entry_fg"],
                fieldbackground=theme["entry_bg"],
                background=theme["entry_bg"],
                selectforeground=theme["entry_fg"],
                selectbackground=theme["entry_bg"],
                arrowcolor=theme["entry_fg"],
                bordercolor=theme["entry_border"],
                lightcolor=theme["entry_border"],
                darkcolor=theme["entry_border"],
                padding=(6, 4, 6, 4),
            )
            self.style.map(
                self.combobox_style,
                fieldbackground=[("readonly", theme["entry_bg"])],
                foreground=[("readonly", theme["entry_fg"])],
                background=[("readonly", theme["entry_bg"])],
            )
            self.category_combobox.configure(style=self.combobox_style)
            self._clear_category_selection()
        if self.montant_container is not None:
            self.montant_container.configure(bg=theme["bg"])
        if self.transaction_container is not None:
            self.transaction_container.configure(bg=theme["bg"])
        if hasattr(self, "transaction_canvas"):
            self.transaction_canvas.configure(bg=theme["bg"])
        self._render_transaction_toggle(theme)

    def _clear_category_selection(self, *_):
        if self.category_combobox is not None:
            self.category_combobox.selection_clear()
            self.category_combobox.icursor("end")

    def _validate_amount(self, proposed: str) -> bool:
        if proposed == "":
            return True
        allowed_chars = set("0123456789.,")
        if any(char not in allowed_chars for char in proposed):
            return False
        if proposed.count(".") + proposed.count(",") > 1:
            return False
        return True

    def _render_transaction_toggle(self, theme):
        if not hasattr(self, "transaction_canvas"):
            return
        self.transaction_canvas.delete("all")
        self.transaction_canvas.configure(bg=theme["bg"])
        track_color = theme["toggle_track_active"] if self.transaction_is_entry else theme["toggle_track"]
        thumb_color = theme["toggle_thumb"]

        width = int(self.transaction_canvas.cget("width"))
        height = int(self.transaction_canvas.cget("height"))
        radius = height // 2

        self.transaction_canvas.create_oval(0, 0, height, height, fill=track_color, outline="")
        self.transaction_canvas.create_oval(width - height, 0, width, height, fill=track_color, outline="")
        self.transaction_canvas.create_rectangle(radius, 0, width - radius, height, fill=track_color, outline="")

        thumb_offset = width - height + 2 if self.transaction_is_entry else 2
        self.transaction_canvas.create_oval(
            thumb_offset,
            2,
            thumb_offset + height - 4,
            height - 2,
            fill=thumb_color,
            outline="",
        )

        self.transaction_label.configure(text="Entrée" if self.transaction_is_entry else "Sortie")

    def _on_transaction_toggle(self, *_):
        self.transaction_is_entry = not self.transaction_is_entry
        self._render_transaction_toggle(self.current_theme)

    def _on_resize(self, event):
        if event.widget is self.root:
            self._update_fonts()

    def _update_fonts(self):
        width = max(self.root.winfo_width(), self.root.winfo_reqwidth())
        height = max(self.root.winfo_height(), self.root.winfo_reqheight())
        reference = min(width, height)
        new_size = max(FONT_MIN_SIZE, min(FONT_MAX_SIZE, reference // FONT_SCALE_DIVISOR))

        if self.entry_font.cget("size") == new_size:
            return

        self.entry_font.configure(size=new_size)
        self.label_font.configure(size=new_size)

        for label in self.labels:
            label.configure(font=self.label_font)
        for entry in self.entries:
            entry.configure(font=self.entry_font)
        if self.category_combobox is not None:
            self.category_combobox.configure(font=self.entry_font)
            self.style.configure(self.combobox_style, font=self.entry_font)
            self._clear_category_selection()
        self._render_transaction_toggle(self.current_theme)

    def toggle_theme(self):
        self.is_dark_mode = not self.is_dark_mode
        self.apply_theme()


if __name__ == "__main__":
    root = Tk()
    app = App(root)

    root.bind("<Escape>", lambda e: root.quit())
    root.mainloop()
