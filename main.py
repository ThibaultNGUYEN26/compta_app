from pathlib import Path
from datetime import date, datetime
import re
import calendar as _calendar
try:
    from openpyxl import Workbook, load_workbook
    from openpyxl.utils import get_column_letter
    from openpyxl.styles import PatternFill, Font
    from openpyxl.chart import PieChart, Reference
    from openpyxl.chart.legend import Legend  # added legend import
    try:
        # Data labels for better readability (percentages inside slices)
        from openpyxl.chart.label import DataLabelList
    except Exception:
        DataLabelList = None
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False
    print("Warning: openpyxl not installed. Excel functionality disabled.")
from tkinter import (
    Button,
    Canvas,
    Entry,
    Frame,
    Label,
    messagebox,
    PhotoImage,
    StringVar,
    Tk,
    TclError,
    Toplevel,
)
from tkinter import ttk
from tkinter import font as tkfont

ICON_SUBSAMPLE = 2
ENTRY_NAMES = ["Date", "Libellé", "Montant", "Catégorie"]
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

# Dynamic sizing constants for toggle switches
TOGGLE_MIN_HEIGHT = 20
TOGGLE_MAX_HEIGHT = 56  # Prevents oversized toggles on huge windows
TOGGLE_ASPECT_RATIO = 1.9  # width = height * ratio

LIGHT_THEME = {
    "bg": "#f0f0f0",
    "fg": "#333333",
    "entry_bg": "#ffffff",
    "entry_fg": "#333333",
    "entry_border": "#cccccc",
    "toggle_track": "#d32f2f",
    "toggle_track_active": "#4caf50",
    "toggle_thumb": "#ffffff",
}

DARK_THEME = {
    "bg": "#2e2e2e",
    "fg": "#f0f0f0",
    "entry_bg": "#3a3a3a",
    "entry_fg": "#f0f0f0",
    "entry_border": "#5a5a5a",
    "toggle_track": "#b71c1c",
    "toggle_track_active": "#66bb6a",
    "toggle_thumb": "#1e0303",
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
        try:
            self.app_icon = PhotoImage(master=self.root, file=str(asset_dir / "compta_app_logo.png"))
            self.root.iconphoto(True, self.app_icon)
        except Exception:
            self.app_icon = None
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
        self.category_var = StringVar()
        self.category_combobox = None
        self.libelle_var = StringVar()
        self.montant_var = StringVar()
        self.amount_validator = self.root.register(self._validate_amount)
        self.libelle_placeholder = "Nom de la transaction"
        self.libelle_has_placeholder = True
        self.montant_placeholder = "0.00"
        self.montant_has_placeholder = True
        self.transaction_is_entry = False
        self.transaction_container = None
        self.is_prelevement = False
        self.prelevement_container = None
        self.date_var = StringVar(value=date.today().strftime("%d-%m-%Y"))
        self.date_entry = None
        self.calendar_win = None
        self._calendar_year = date.today().year
        self._calendar_month = date.today().month
        self._selected_date = None  # Track the selected date for highlighting
        self._calendar_opening = False  # Flag to prevent immediate closing

        self.header_frame = Frame(self.root, bg=LIGHT_THEME["bg"])
        self.header_frame.pack(fill="x")

        self.toggle_button = Button(
            self.header_frame,
            command=self.toggle_theme,
            highlightthickness=0,
            borderwidth=0,
            relief="flat",
            bg=LIGHT_THEME["bg"],
            activebackground=LIGHT_THEME["bg"],
            image=self.dark_mode_icon,
        )
        self.toggle_button.pack(side="right", padx=12, pady=8)

        self.body = Frame(self.root, bg=LIGHT_THEME["bg"])
        self.body.pack(expand=True, fill="both", padx=40, pady=10)

        self.body.grid_rowconfigure(0, weight=1)
        self.body.grid_rowconfigure(1, weight=0)
        self.body.grid_rowconfigure(2, weight=1)
        self.body.grid_columnconfigure(0, weight=1)

        self.entry_frame = Frame(self.body, bg=LIGHT_THEME["bg"])
        self.entry_frame.grid(row=1, column=0)

        for i in range(4):
            self.entry_frame.columnconfigure(i, weight=1, uniform="col")

        for col, name in enumerate(ENTRY_NAMES):
            lbl = Label(
                self.entry_frame,
                text=name,
                anchor="center",
                pady=0,
                bg=LIGHT_THEME["bg"],
                fg=LIGHT_THEME["fg"],
                font=self.label_font,
            )
            lbl.grid(row=0, column=col, sticky="ew", padx=10, pady=(0, 4))
            self.labels.append(lbl)

        self.date_entry = Entry(
            self.entry_frame,
            textvariable=self.date_var,
            justify="center",
            relief="flat",
            highlightthickness=1,
            font=self.entry_font,
            exportselection=False,
        )
        self.date_entry.grid(row=1, column=0, sticky="new", padx=10, pady=(0, 8), ipady=4)
        self.date_entry.bind("<Button-1>", lambda e: self._on_date_entry_click())
        self.entries.append(self.date_entry)

        libelle_entry = Entry(
            self.entry_frame,
            textvariable=self.libelle_var,
            justify="center",
            relief="flat",
            highlightthickness=1,
            font=self.entry_font,
            exportselection=False,
        )
        libelle_entry.grid(row=1, column=1, sticky="new", padx=10, pady=(0, 8), ipady=4)
        libelle_entry.bind("<FocusIn>", self._on_libelle_focus_in)
        libelle_entry.bind("<FocusOut>", self._on_libelle_focus_out)
        self.entries.append(libelle_entry)
        self.libelle_entry = libelle_entry

        montant_entry = Entry(
            self.entry_frame,
            textvariable=self.montant_var,
            justify="center",
            relief="flat",
            highlightthickness=1,
            font=self.entry_font,
            exportselection=False,
            validate="key",
            validatecommand=(self.amount_validator, "%P"),
        )
        montant_entry.grid(row=1, column=2, sticky="new", padx=10, pady=(0, 8), ipady=4)
        montant_entry.bind("<FocusIn>", self._on_montant_focus_in)
        montant_entry.bind("<FocusOut>", self._on_montant_focus_out)
        self.entries.append(montant_entry)
        self.montant_entry = montant_entry

        self.category_combobox = ttk.Combobox(
            self.entry_frame,
            textvariable=self.category_var,
            values=CATEGORY_VALUES,
            state="readonly",
            style=self.combobox_style,
            exportselection=False,
        )
        self.category_combobox.grid(row=1, column=3, sticky="new", padx=10, pady=(0, 8))
        self.category_combobox.configure(font=self.entry_font)
        self.category_combobox.bind("<<ComboboxSelected>>", self._clear_category_selection)
        self.category_combobox.bind("<FocusOut>", self._clear_category_selection)

        # Prélèvement toggle container
        self.prelevement_container = Frame(self.entry_frame, bg=LIGHT_THEME["bg"])
        self.prelevement_container.grid(row=2, column=3, pady=(2, 0))

        # Add "Prélèvement" label
        prelevement_text_label = Label(
            self.prelevement_container,
            text="Prélèvement",
            bg=LIGHT_THEME["bg"],
            fg=LIGHT_THEME["fg"],
            font=self.label_font,
        )
        prelevement_text_label.pack(side="top", pady=(0, 4))
        self.labels.append(prelevement_text_label)

        # Create a sub-container for the toggle elements
        self.prelevement_toggle_container = Frame(self.prelevement_container, bg=LIGHT_THEME["bg"])
        self.prelevement_toggle_container.pack()

        self.prelevement_label = Label(
            self.prelevement_toggle_container,
            text="Non",
            bg=LIGHT_THEME["bg"],
            fg=LIGHT_THEME["fg"],
            font=self.label_font,
        )
        self.prelevement_label.pack(side="left", padx=(0, 6))
        self.prelevement_label.bind("<Button-1>", self._on_prelevement_toggle)
        self.labels.append(self.prelevement_label)

        self.prelevement_canvas = Canvas(
            self.prelevement_toggle_container,
            width=54,
            height=28,
            bd=0,
            highlightthickness=0,
            relief="flat",
            bg=LIGHT_THEME["bg"],
        )
        self.prelevement_canvas.pack(side="left", padx=(8, 0))
        self.prelevement_canvas.bind("<Button-1>", self._on_prelevement_toggle)

        self.transaction_container = Frame(self.entry_frame, bg=LIGHT_THEME["bg"])
        self.transaction_container.grid(row=2, column=2, pady=(2, 0))

        self.transaction_label = Label(
            self.transaction_container,
            text="Sortie",
            bg=LIGHT_THEME["bg"],
            fg=LIGHT_THEME["fg"],
            font=self.label_font,
        )
        self.transaction_label.pack(side="left", padx=(0, 6))
        self.transaction_label.bind("<Button-1>", self._on_transaction_toggle)
        self.labels.append(self.transaction_label)

        self.transaction_canvas = Canvas(
            self.transaction_container,
            width=54,
            height=28,
            bd=0,
            highlightthickness=0,
            relief="flat",
            bg=LIGHT_THEME["bg"],
        )
        self.transaction_canvas.pack(side="left", padx=(8, 0))
        self.transaction_canvas.bind("<Button-1>", self._on_transaction_toggle)

        # Add the "Ajouter la ligne" button
        self.add_button = Button(
            self.entry_frame,
            text="Ajouter la ligne",
            command=self._add_row,
            relief="flat",
            borderwidth=0,
            padx=20,
            pady=8,
            bg=LIGHT_THEME["toggle_track_active"],
            fg=LIGHT_THEME["toggle_thumb"],
            activebackground=LIGHT_THEME["toggle_track"],
            font=self.label_font,
            cursor="hand2"
        )
        self.add_button.grid(row=3, column=0, columnspan=4, pady=(20, 0))

        self.apply_theme()
        self._update_fonts()
        self._clear_category_selection()
        self._render_transaction_toggle(LIGHT_THEME)
        self._render_prelevement_toggle(LIGHT_THEME)
        self._initialize_libelle_placeholder()
        self._initialize_montant_placeholder()

        self.root.bind("<Configure>", self._on_resize)

        # Bind click events to close calendar when clicking inside the app window
        self.root.bind("<Button-1>", self._maybe_close_calendar, add="+")


    def apply_theme(self):
        theme = DARK_THEME if self.is_dark_mode else LIGHT_THEME
        self.current_theme = theme

        self.root.configure(bg=theme["bg"])
        self.header_frame.configure(bg=theme["bg"])
        self.body.configure(bg=theme["bg"])
        self.entry_frame.configure(bg=theme["bg"])

        self.toggle_button.configure(
            image=self.light_mode_icon if self.is_dark_mode else self.dark_mode_icon,
            bg=theme["bg"],
            activebackground=theme["bg"],
        )

        for label in self.labels:
            label.configure(bg=theme["bg"], fg=theme["fg"])

        for entry in self.entries:
            if entry == getattr(self, 'libelle_entry', None):
                # Special handling for libellé entry to preserve placeholder styling
                entry.configure(
                    bg=theme["entry_bg"],
                    insertbackground=theme["entry_fg"],
                    highlightbackground=theme["entry_border"],
                    highlightcolor=theme["entry_border"],
                )
                # Don't set fg here - let _update_libelle_appearance handle it
            elif entry == getattr(self, 'montant_entry', None):
                # Special handling for montant entry to preserve placeholder styling
                entry.configure(
                    bg=theme["entry_bg"],
                    insertbackground=theme["entry_fg"],
                    highlightbackground=theme["entry_border"],
                    highlightcolor=theme["entry_border"],
                )
                # Don't set fg here - let _update_montant_appearance handle it
            else:
                entry.configure(
                    bg=theme["entry_bg"],
                    fg=theme["entry_fg"],
                    insertbackground=theme["entry_fg"],
                    highlightbackground=theme["entry_border"],
                    highlightcolor=theme["entry_border"],
                )

        # Update appearance after theme change
        if hasattr(self, 'libelle_entry'):
            self._update_libelle_appearance()
        if hasattr(self, 'montant_entry'):
            self._update_montant_appearance()

        # Apply theme to add button
        if hasattr(self, 'add_button'):
            self.add_button.configure(
                bg=theme["toggle_track_active"],
                fg=theme["toggle_thumb"],
                activebackground=theme["toggle_track"],
                activeforeground=theme["toggle_thumb"]
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
                borderwidth=0,
                focuscolor="none",
                relief="flat",
                highlightthickness=0,
                insertwidth=0,
                padding=(6, 5, 6, 5),  # Reduced vertical padding
            )
            self.style.map(
                self.combobox_style,
                fieldbackground=[("readonly", theme["entry_bg"]), ("focus", theme["entry_bg"]), ("active", theme["entry_bg"])],
                foreground=[("readonly", theme["entry_fg"]), ("focus", theme["entry_fg"]), ("active", theme["entry_fg"])],
                background=[("readonly", theme["entry_bg"]), ("focus", theme["entry_bg"]), ("active", theme["entry_bg"])],
                relief=[("readonly", "flat"), ("focus", "flat"), ("active", "flat")],
                borderwidth=[("readonly", 0), ("focus", 0), ("active", 0)],
                highlightthickness=[("readonly", 0), ("focus", 0), ("active", 0)],
            )
            self.category_combobox.configure(style=self.combobox_style)

            # Configure dropdown list font and colors
            try:
                self.style.configure("App.TCombobox.Listbox",
                                   font=self.entry_font,
                                   background=theme["entry_bg"],
                                   foreground=theme["entry_fg"],
                                   selectbackground=theme["toggle_track_active"],
                                   selectforeground=theme["toggle_thumb"])
            except Exception:
                pass

            self._clear_category_selection()

        if self.transaction_container is not None:
            self.transaction_container.configure(bg=theme["bg"])
        if hasattr(self, "transaction_canvas"):
            self.transaction_canvas.configure(bg=theme["bg"])

        if self.prelevement_container is not None:
            self.prelevement_container.configure(bg=theme["bg"])
        if hasattr(self, "prelevement_toggle_container"):
            self.prelevement_toggle_container.configure(bg=theme["bg"])
        if hasattr(self, "prelevement_canvas"):
            self.prelevement_canvas.configure(bg=theme["bg"])

        self._render_transaction_toggle(theme)
        self._render_prelevement_toggle(theme)
        self._refresh_calendar_theme()

    def _clear_category_selection(self, *_):
        if self.category_combobox is not None:
            self.category_combobox.selection_clear()
            self.category_combobox.icursor("end")

    def _validate_amount(self, proposed: str) -> bool:
        # Allow empty string and placeholder value
        if proposed == "" or proposed == self.montant_placeholder:
            return True
        allowed_chars = set("0123456789.,")
        if any(char not in allowed_chars for char in proposed):
            return False
        if proposed.count(".") + proposed.count(",") > 1:
            return False
        return True

    def _on_montant_focus_in(self, event):
        """Handle focus in event for montant entry - remove placeholder"""
        if self.montant_has_placeholder:
            self.montant_var.set("")
            self.montant_has_placeholder = False
            self._update_montant_appearance()

    def _on_montant_focus_out(self, event):
        """Handle focus out event for montant entry - add placeholder if empty"""
        if not self.montant_var.get().strip():
            self.montant_var.set(self.montant_placeholder)
            self.montant_has_placeholder = True
            self._update_montant_appearance()

    def _update_montant_appearance(self):
        """Update the appearance of montant entry based on placeholder state"""
        if hasattr(self, 'montant_entry') and self.montant_entry:
            theme = self.current_theme
            if self.montant_has_placeholder:
                # Placeholder style - lighter text
                self.montant_entry.configure(
                    fg=theme["entry_border"]  # Use border color for placeholder (lighter)
                )
            else:
                # Normal style
                self.montant_entry.configure(
                    fg=theme["entry_fg"]
                )

    def _initialize_montant_placeholder(self):
        """Initialize the placeholder in the montant entry"""
        if not self.montant_var.get().strip():
            self.montant_var.set(self.montant_placeholder)
            self.montant_has_placeholder = True
            self._update_montant_appearance()

    def _on_libelle_focus_in(self, event):
        """Handle focus in event for libellé entry - remove placeholder"""
        if self.libelle_has_placeholder:
            self.libelle_var.set("")
            self.libelle_has_placeholder = False
            self._update_libelle_appearance()

    def _on_libelle_focus_out(self, event):
        """Handle focus out event for libellé entry - add placeholder if empty"""
        if not self.libelle_var.get().strip():
            self.libelle_var.set(self.libelle_placeholder)
            self.libelle_has_placeholder = True
            self._update_libelle_appearance()

    def _update_libelle_appearance(self):
        """Update the appearance of libellé entry based on placeholder state"""
        if hasattr(self, 'libelle_entry') and self.libelle_entry:
            theme = self.current_theme
            if self.libelle_has_placeholder:
                # Placeholder style - lighter text
                self.libelle_entry.configure(
                    fg=theme["entry_border"]  # Use border color for placeholder (lighter)
                )
            else:
                # Normal style
                self.libelle_entry.configure(
                    fg=theme["entry_fg"]
                )

    def _initialize_libelle_placeholder(self):
        """Initialize the placeholder in the libellé entry"""
        if not self.libelle_var.get().strip():
            self.libelle_var.set(self.libelle_placeholder)
            self.libelle_has_placeholder = True
            self._update_libelle_appearance()

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

    def _render_prelevement_toggle(self, theme):
        if not hasattr(self, "prelevement_canvas"):
            return
        self.prelevement_canvas.delete("all")
        self.prelevement_canvas.configure(bg=theme["bg"])
        track_color = theme["toggle_track_active"] if self.is_prelevement else theme["toggle_track"]
        thumb_color = theme["toggle_thumb"]

        width = int(self.prelevement_canvas.cget("width"))
        height = int(self.prelevement_canvas.cget("height"))
        radius = height // 2

        self.prelevement_canvas.create_oval(0, 0, height, height, fill=track_color, outline="")
        self.prelevement_canvas.create_oval(width - height, 0, width, height, fill=track_color, outline="")
        self.prelevement_canvas.create_rectangle(radius, 0, width - radius, height, fill=track_color, outline="")

        thumb_offset = width - height + 2 if self.is_prelevement else 2
        self.prelevement_canvas.create_oval(
            thumb_offset,
            2,
            thumb_offset + height - 4,
            height - 2,
            fill=thumb_color,
            outline="",
        )

        self.prelevement_label.configure(text="Oui" if self.is_prelevement else "Non")

    def _on_prelevement_toggle(self, *_):
        self.is_prelevement = not self.is_prelevement
        self._render_prelevement_toggle(self.current_theme)

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

        # Update add button font
        if hasattr(self, 'add_button'):
            self.add_button.configure(font=self.label_font)

        if self.category_combobox is not None:
            self.category_combobox.configure(font=self.entry_font)
            self.style.configure(self.combobox_style, font=self.entry_font)
            # Also configure the dropdown list font
            try:
                self.style.configure("App.TCombobox.Listbox", font=self.entry_font)
            except Exception:
                pass
            self._clear_category_selection()
        # Dynamic toggle sizing based on computed font size / window
        toggle_height = int(new_size * 1.7)
        toggle_height = max(TOGGLE_MIN_HEIGHT, min(TOGGLE_MAX_HEIGHT, toggle_height))
        toggle_width = int(toggle_height * TOGGLE_ASPECT_RATIO)

        resized = False
        if hasattr(self, 'transaction_canvas') and self.transaction_canvas:
            cur_w = int(self.transaction_canvas.cget('width'))
            cur_h = int(self.transaction_canvas.cget('height'))
            if cur_w != toggle_width or cur_h != toggle_height:
                self.transaction_canvas.configure(width=toggle_width, height=toggle_height)
                resized = True
        if hasattr(self, 'prelevement_canvas') and self.prelevement_canvas:
            cur_w = int(self.prelevement_canvas.cget('width'))
            cur_h = int(self.prelevement_canvas.cget('height'))
            if cur_w != toggle_width or cur_h != toggle_height:
                self.prelevement_canvas.configure(width=toggle_width, height=toggle_height)
                resized = True

        # Re-render toggles (always if resized; cheap operation)
        if resized:
            self._render_transaction_toggle(self.current_theme)
            self._render_prelevement_toggle(self.current_theme)
        else:
            self._render_transaction_toggle(self.current_theme)
            self._render_prelevement_toggle(self.current_theme)
        if self.calendar_win is not None:
            self._build_calendar_body()

    def _add_row(self):
        """Handle adding a new row with the current form data"""
        if not EXCEL_AVAILABLE:
            print("Excel functionality not available. Please install openpyxl: pip install openpyxl")
            return

        # Get the form data
        date_value = self.date_var.get().strip()
        libelle_value = self.libelle_var.get().strip()
        montant_value = self.montant_var.get().strip()
        category_value = self.category_var.get().strip()
        transaction_type = "Entrée" if self.transaction_is_entry else "Sortie"
        prelevement_status = "Oui" if self.is_prelevement else "Non"

        # Basic validation
        if not date_value:
            print("Date is required")
            return
        if not libelle_value or libelle_value == self.libelle_placeholder:
            print("Libellé is required")
            return
        if not montant_value or montant_value == self.montant_placeholder:
            print("Montant is required")
            return
        if not category_value:
            print("Catégorie is required")
            return

        try:
            # Parse the date to get year and month
            parsed_date = datetime.strptime(date_value, "%d-%m-%Y")
            year = parsed_date.year
            month = parsed_date.month

            # Write to Excel
            self._write_to_excel(date_value, libelle_value, montant_value, category_value, transaction_type, prelevement_status, year, month)


            print(f"Successfully added: Date={date_value}, Libellé={libelle_value}, Montant={montant_value}, Catégorie={category_value}, Type={transaction_type}, Prélèvement={prelevement_status}")

            # Clear the form after adding
            self.libelle_var.set(self.libelle_placeholder)
            self.libelle_has_placeholder = True
            self._update_libelle_appearance()
            self.montant_var.set(self.montant_placeholder)
            self.montant_has_placeholder = True
            self._update_montant_appearance()
            self.category_var.set("")
            # Keep the date as it might be reused

            # Clear category selection
            self._clear_category_selection()

            # Reset toggles to default after successful add
            self.transaction_is_entry = False
            self.is_prelevement = False
            self._render_transaction_toggle(self.current_theme)
            self._render_prelevement_toggle(self.current_theme)

        except ValueError:
            print("Invalid date format. Please use DD-MM-YYYY format.")
        except Exception as e:
            print(f"Error adding row: {e}")

    def _write_to_excel(self, date_value, libelle_value, montant_value, category_value, transaction_type, prelevement_status, year, month):
        """Write data to Excel file with the specified structure"""
        if not EXCEL_AVAILABLE:
            return

        # Create directory for accounting files if it doesn't exist
        base_dir = Path(__file__).resolve().parent / "dossier_compta"
        try:
            base_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            print(f"Warning: could not create directory {base_dir}: {e}")
        # Create file path inside the subdirectory
        filename = f"Compta_{year}.xlsx"
        file_path = base_dir / filename

        # Sheet name format: MM_YYYY
        sheet_name = f"{month:02d}_{year}"

        # Handle file locks with a simple guided retry flow
        while True:
            try:
                # Try to load existing workbook
                if file_path.exists():
                    wb = load_workbook(file_path)
                else:
                    wb = Workbook()
                    # Remove default sheet
                    if "Sheet" in wb.sheetnames:
                        wb.remove(wb["Sheet"])

                # Get or create the sheet for this month
                if sheet_name in wb.sheetnames:
                    ws = wb[sheet_name]
                else:
                    ws = wb.create_sheet(sheet_name)
                    # Add headers
                    headers = ["Date", "Libellé", "Montant", "Catégorie", "Type", "Prélèvement"]
                    for col, header in enumerate(headers, 1):
                        ws.cell(row=1, column=col, value=header)

                # Find the next empty row considering only transaction data columns (A-F)
                next_row = self._find_next_transaction_row(ws)

                # Add the data
                # Column A: store as real date (not text)
                date_cell = ws.cell(row=next_row, column=1)
                try:
                    parsed_dt = datetime.strptime(date_value, "%d-%m-%Y").date()
                    date_cell.value = parsed_dt
                    # Use localized short date style (day/month/year)
                    date_cell.number_format = "dd/mm/yyyy"
                except Exception:
                    # Fallback to original text if parsing fails
                    date_cell.value = date_value
                ws.cell(row=next_row, column=2, value=libelle_value)
                montant_cell = ws.cell(row=next_row, column=3)
                try:
                    montant_numeric = float(str(montant_value).replace(",", "."))
                    montant_cell.value = montant_numeric
                    montant_cell.number_format = "#,##0.00 [$€-fr-FR]"
                except Exception:
                    montant_cell.value = montant_value
                ws.cell(row=next_row, column=4, value=category_value)
                ws.cell(row=next_row, column=5, value=transaction_type)
                ws.cell(row=next_row, column=6, value=prelevement_status)

                # Apply color formatting with priority: Prélèvement > Transaction Type
                if prelevement_status == "Oui":
                    # Yellow background for prélèvement (light yellow with dark orange text)
                    fill = PatternFill(start_color="FFF9C4", end_color="FFF9C4", fill_type="solid")
                    font_color = Font(color="F57F17")
                elif transaction_type == "Entrée":
                    # Green background for income (light green with dark green text)
                    fill = PatternFill(start_color="C8E6C9", end_color="C8E6C9", fill_type="solid")
                    font_color = Font(color="2E7D32")
                else:  # "Sortie"
                    # Red background for outcome (light red with dark red text)
                    fill = PatternFill(start_color="FFCDD2", end_color="FFCDD2", fill_type="solid")
                    font_color = Font(color="C62828")

                # Apply formatting to all cells in the row
                for col in range(1, 7):  # Columns 1-6 (Date, Libellé, Montant, Catégorie, Type, Prélèvement)
                    cell = ws.cell(row=next_row, column=col)
                    cell.fill = fill
                    cell.font = font_color

                try:
                    for r in range(2, ws.max_row + 1):
                        c = ws.cell(row=r, column=3)
                        v = c.value
                        if isinstance(v, str):
                            try:
                                c.value = float(v.replace(",", "."))
                            except Exception:
                                pass
                        if isinstance(c.value, (int, float)):
                            c.number_format = "#,##0.00 [$€-fr-FR]"
                except Exception:
                    pass

                # Try to save the workbook
                # Update statistics for this sheet before saving
                try:
                    self._update_sheet_statistics(ws)
                except Exception as e:
                    print(f"Warning: could not update statistics: {e}")
                # Normalize existing date column values to real dates
                try:
                    self._normalize_date_column(ws)
                except Exception as e:
                    print(f"Warning: could not normalize dates: {e}")
                # Apply fixed column widths (A-F = 20, H-I = 30) before font sizing
                try:
                    self._apply_fixed_widths(ws)
                except Exception as e:
                    print(f"Warning: could not apply fixed widths: {e}")
                # Apply font sizing (headers vs data) before saving
                try:
                    self._apply_sheet_fonts(ws)
                except Exception as e:
                    print(f"Warning: could not apply font sizing: {e}")
                wb.save(file_path)
                try:
                    rel_path = file_path.relative_to(Path(__file__).resolve().parent)
                except Exception:
                    rel_path = file_path
                print(f"Data saved to {rel_path}, sheet {sheet_name}")
                break

            except PermissionError:
                # Excel likely has the file open. Ask user to close and retry.
                retry = messagebox.askretrycancel(
                    title="Excel file is open",
                    message=(
                        f"Le fichier {filename} est ouvert dans Excel et ne peut pas être modifié.\n\n"
                        "Fermez le fichier dans Excel puis cliquez sur Réessayer.\n"
                        "Cliquez sur Annuler pour abandonner l'enregistrement."
                    ),
                )
                if not retry:
                    print("Save cancelled by user due to open Excel file.")
                    return
            except Exception as e:
                print(f"Error writing to Excel: {e}")
                raise

    def toggle_theme(self):
        self.is_dark_mode = not self.is_dark_mode
        self.apply_theme()

    # ------------------ Statistics Helpers ------------------
    def _update_sheet_statistics(self, ws):
        """Compute and write statistics into columns H (labels) & I (values).

        Revised logic (treat 'Épargne' as internal transfers between current & savings):
          - Non-Épargne Entrée: +current
          - Non-Épargne Sortie: -current
          - Épargne Sortie: +current, -savings  (withdraw from savings -> current)
          - Épargne Entrée: -current, +savings  (deposit into savings from current)
        This matches expectation: a 'Sortie Épargne' increases current balance and decreases savings.
        Savings balance accumulates net movements (positive => more saved, negative => withdrawn).

        Additional statistics added:
          - Montant Total Sorties (sum of all Sortie amounts)
          - Montant Total Entrées (sum of all Entrée amounts)
          - Nombre Prélèvements (count where Prélèvement == 'Oui')
          - Montant Total Prélèvements (sum of amounts where Prélèvement == 'Oui')
        """
        current_account_balance = 0.0
        savings_balance = 0.0
        count_income = 0
        count_outcome = 0
        total_sorties_amount = 0.0
        total_entrees_amount = 0.0
        count_prelevements = 0
        total_prelevements_amount = 0.0

        # Per-category aggregation
        # Structure: cat_stats[category] = {"entrees_amount": float, "sorties_amount": float}
        cat_stats = {}

        for r in range(2, ws.max_row + 1):
            type_cell = ws.cell(row=r, column=5).value
            cat_cell = ws.cell(row=r, column=4).value
            montant_cell = ws.cell(row=r, column=3).value
            prelevement_cell = ws.cell(row=r, column=6).value
            try:
                amount = float(str(montant_cell).replace(',', '.')) if montant_cell not in (None, "") else 0.0
            except Exception:
                amount = 0.0

            if type_cell == "Entrée":
                count_income += 1
                total_entrees_amount += amount
                if cat_cell == "Épargne":
                    # Money moved from current -> savings
                    current_account_balance -= amount
                    savings_balance += amount
                else:
                    current_account_balance += amount
            elif type_cell == "Sortie":
                count_outcome += 1
                total_sorties_amount += amount
                if cat_cell == "Épargne":
                    # Money moved from savings -> current
                    current_account_balance += amount
                    savings_balance -= amount
                else:
                    current_account_balance -= amount

            if prelevement_cell == "Oui":
                count_prelevements += 1
                total_prelevements_amount += amount

            # Track per category (ignore empty category cells)
            if cat_cell:
                if cat_cell not in cat_stats:
                    cat_stats[cat_cell] = {"entrees_amount": 0.0, "sorties_amount": 0.0}
                if type_cell == "Entrée":
                    cat_stats[cat_cell]["entrees_amount"] += amount
                elif type_cell == "Sortie":
                    cat_stats[cat_cell]["sorties_amount"] += amount

        # Build stats list (global first)
        stats = [
            ("Solde Compte Courant", current_account_balance),
            ("Solde Épargne", savings_balance),
            ("Nombre Sorties", count_outcome),
            ("Nombre Entrées", count_income),
            ("Montant Total Sorties", total_sorties_amount),
            ("Montant Total Entrées", total_entrees_amount),
            ("Nombre Prélèvements", count_prelevements),
            ("Montant Total Prélèvements", total_prelevements_amount),
        ]
        # NOTE (user request): per-category stats removed from H/I area.
        # We still compute cat_stats above to feed the doughnut chart and
        # populate temporary columns K/L, but we no longer append the
        # per-category breakdown lines into the stats list.

        # Clear previous stats area sized to new stats length (add a little buffer)
        clear_rows = max(16, len(stats) + 2)
        for r in range(1, clear_rows + 1):
            ws.cell(row=r, column=8).value = None
            ws.cell(row=r, column=9).value = None

        # Write labels & values
        header_font = Font(bold=True)
        ws.cell(row=1, column=8, value="Statistiques").font = header_font
        row = 2
        for label, val in stats:
            ws.cell(row=row, column=8, value=label)
            v_cell = ws.cell(row=row, column=9, value=val)
            if isinstance(val, (int, float)) and (label.startswith("Solde") or label.startswith("Montant")):
                try:
                    v_cell.number_format = "#,##0.00 [$€-fr-FR]"
                except Exception:
                    pass
            row += 1

        # Auto-adjust column widths (simple heuristic)
        for col in (8, 9):
            max_len = 0
            for r in range(1, row):
                v = ws.cell(row=r, column=col).value
                if v is None:
                    continue
                l = len(str(v))
                if l > max_len:
                    max_len = l
            ws.column_dimensions[get_column_letter(col)].width = max(14, min(40, max_len + 2))

        # Create category tables and charts for Outcome (Sorties) and Income (Entrées)
        try:
            # Clear K/L rows 1-40 to accommodate shifted income section
            for r in range(1, 41):
                ws.cell(row=r, column=11).value = None  # K
                ws.cell(row=r, column=12).value = None  # L

            # Row 1 title for outcome section
            ws.cell(row=1, column=11, value="Outcome")
            # Rows 2-13 categories outcome values (skip zeros -> leave blank)
            for i, cat in enumerate(CATEGORY_VALUES):
                row_idx = 2 + i
                amt_sortie = cat_stats.get(cat, {}).get("sorties_amount", 0)
                if amt_sortie not in (0, 0.0, None):
                    ws.cell(row=row_idx, column=11, value=cat)
                    vcell = ws.cell(row=row_idx, column=12, value=amt_sortie)
                    try:
                        vcell.number_format = "#,##0.00 [$€-fr-FR]"
                    except Exception:
                        pass
                else:
                    # Ensure cells remain empty if zero
                    ws.cell(row=row_idx, column=11, value=None)
                    ws.cell(row=row_idx, column=12, value=None)

            # Blank separator row 14 (leave empty)
            # Rows 15-23 left intentionally blank after refactor
            # Row 21 title for income section (adjusted per user request)
            income_title_cell = ws.cell(row=21, column=11, value="Income")
            try:
                income_title_cell.font = Font(bold=True, size=20)
            except Exception:
                pass
            # Rows 22-33 categories income values (skip zeros -> leave blank)
            for i, cat in enumerate(CATEGORY_VALUES):
                row_idx = 22 + i
                amt_entree = cat_stats.get(cat, {}).get("entrees_amount", 0)
                if amt_entree not in (0, 0.0, None):
                    ws.cell(row=row_idx, column=11, value=cat)
                    vcell = ws.cell(row=row_idx, column=12, value=amt_entree)
                    try:
                        vcell.number_format = "#,##0.00 [$€-fr-FR]"
                    except Exception:
                        pass
                else:
                    ws.cell(row=row_idx, column=11, value=None)
                    ws.cell(row=row_idx, column=12, value=None)

            # -------- Outcome Chart (Sorties) --------
            labels_ref_out = Reference(ws, min_col=11, max_col=11, min_row=2, max_row=13)
            values_ref_out = Reference(ws, min_col=12, max_col=12, min_row=2, max_row=13)
            pie_out = PieChart()
            pie_out.title = "Sorties par Catégorie"
            pie_out.add_data(values_ref_out, titles_from_data=False)
            pie_out.set_categories(labels_ref_out)
            try:
                if pie_out.series and len(pie_out.series) > 0:
                    pie_out.series[0].title = ""
            except Exception:
                pass
            try:
                pie_out.holeSize = 55
            except Exception:
                pass
            if DataLabelList is not None:
                try:
                    dll_o = DataLabelList()
                    dll_o.showPercent = True
                    dll_o.showCatName = True
                    dll_o.showVal = False
                    from openpyxl.chart.label import DataLabel
                    from openpyxl.drawing.text import RichText, Paragraph, ParagraphProperties, CharacterProperties
                    for i in range(len(CATEGORY_VALUES)):
                        dl = DataLabel(idx=i)
                        dl.txPr = RichText(p=[Paragraph(pPr=ParagraphProperties(defRPr=CharacterProperties(sz=1400)))])
                        dll_o.dLbl.append(dl)
                    pie_out.dataLabels = dll_o
                except Exception:
                    pass
            # Palette for outcome
            palette_out = [
                "FF5722","4CAF50","2196F3","9C27B0","FFC107","009688","E91E63","3F51B5","795548","607D8B","8BC34A","FF9800"
            ]
            try:
                if pie_out.series:
                    ser_o = pie_out.series[0]
                    for i in range(len(CATEGORY_VALUES)):
                        from openpyxl.chart.series import DataPoint
                        try:
                            pt = ser_o.dPt[i]
                        except IndexError:
                            pt = DataPoint(idx=i)
                            ser_o.dPt.append(pt)
                        try:
                            color_hex = palette_out[i % len(palette_out)]
                            pt.graphicalProperties.solidFill = color_hex
                        except Exception:
                            pass
            except Exception:
                pass
            try:
                if getattr(pie_out, 'legend', None) is None:
                    from openpyxl.chart.legend import Legend as _Legend
                    pie_out.legend = _Legend()
                pie_out.legend.position = 'r'
                from openpyxl.drawing.text import RichText, Paragraph, ParagraphProperties, CharacterProperties
                pie_out.legend.txPr = RichText(p=[Paragraph(pPr=ParagraphProperties(defRPr=CharacterProperties(sz=1600)))])
            except Exception:
                pass
            pie_out.height = 18
            pie_out.width = 24
            try:
                from openpyxl.drawing.text import ParagraphProperties, CharacterProperties
                if getattr(pie_out, 'title', None) and getattr(pie_out.title, 'tx', None) and getattr(pie_out.title.tx, 'rich', None):
                    for p in pie_out.title.tx.rich.p:
                        if p.pPr is None:
                            p.pPr = ParagraphProperties()
                        p.pPr.defRPr = CharacterProperties(sz=2000)
            except Exception:
                pass

            # Remove previous outcome chart(s)
            try:
                to_remove = []
                for obj in ws._charts:
                    if getattr(obj, 'title', None) and 'Sorties par Catégorie' in str(obj.title):
                        to_remove.append(obj)
                for obj in to_remove:
                    ws._charts.remove(obj)
            except Exception:
                pass
            ws.add_chart(pie_out, "O2")

            # -------- Income Chart (Entrées) --------
            labels_ref_in = Reference(ws, min_col=11, max_col=11, min_row=22, max_row=33)
            values_ref_in = Reference(ws, min_col=12, max_col=12, min_row=22, max_row=33)
            pie_in = PieChart()
            pie_in.title = "Entrées par Catégorie"
            pie_in.add_data(values_ref_in, titles_from_data=False)
            pie_in.set_categories(labels_ref_in)
            try:
                if pie_in.series and len(pie_in.series) > 0:
                    pie_in.series[0].title = ""
            except Exception:
                pass
            try:
                pie_in.holeSize = 55
            except Exception:
                pass
            if DataLabelList is not None:
                try:
                    dll_i = DataLabelList()
                    dll_i.showPercent = True
                    dll_i.showCatName = True
                    dll_i.showVal = False
                    from openpyxl.chart.label import DataLabel
                    from openpyxl.drawing.text import RichText, Paragraph, ParagraphProperties, CharacterProperties
                    for i in range(len(CATEGORY_VALUES)):
                        dl = DataLabel(idx=i)
                        dl.txPr = RichText(p=[Paragraph(pPr=ParagraphProperties(defRPr=CharacterProperties(sz=1400)))])
                        dll_i.dLbl.append(dl)
                    pie_in.dataLabels = dll_i
                except Exception:
                    pass
            palette_in = [
                "2196F3","4CAF50","FFC107","9C27B0","FF5722","009688","E91E63","3F51B5","795548","607D8B","8BC34A","FF9800"
            ]
            try:
                if pie_in.series:
                    ser_i = pie_in.series[0]
                    from openpyxl.chart.series import DataPoint
                    for i in range(len(CATEGORY_VALUES)):
                        try:
                            pt = ser_i.dPt[i]
                        except IndexError:
                            pt = DataPoint(idx=i)
                            ser_i.dPt.append(pt)
                        try:
                            color_hex = palette_in[i % len(palette_in)]
                            pt.graphicalProperties.solidFill = color_hex
                        except Exception:
                            pass
            except Exception:
                pass
            try:
                if getattr(pie_in, 'legend', None) is None:
                    from openpyxl.chart.legend import Legend as _Legend
                    pie_in.legend = _Legend()
                pie_in.legend.position = 'r'
                from openpyxl.drawing.text import RichText, Paragraph, ParagraphProperties, CharacterProperties
                pie_in.legend.txPr = RichText(p=[Paragraph(pPr=ParagraphProperties(defRPr=CharacterProperties(sz=1600)))])
            except Exception:
                pass
            pie_in.height = 18
            pie_in.width = 24
            try:
                from openpyxl.drawing.text import ParagraphProperties, CharacterProperties
                if getattr(pie_in, 'title', None) and getattr(pie_in.title, 'tx', None) and getattr(pie_in.title.tx, 'rich', None):
                    for p in pie_in.title.tx.rich.p:
                        if p.pPr is None:
                            p.pPr = ParagraphProperties()
                        p.pPr.defRPr = CharacterProperties(sz=2000)
            except Exception:
                pass
            # Remove previous income chart(s)
            try:
                to_remove = []
                for obj in ws._charts:
                    if getattr(obj, 'title', None) and 'Entrées par Catégorie' in str(obj.title):
                        to_remove.append(obj)
                for obj in to_remove:
                    ws._charts.remove(obj)
            except Exception:
                pass
            ws.add_chart(pie_in, "O21")  # repositioned to align with new income title row
            # Ensure uniform row heights so blank spacer rows (14-23) aren't visually compressed
            try:
                # Choose a height that fits 18-20pt fonts comfortably
                uniform_height = 28  # points
                for r in range(1, 41):  # cover both outcome & income table zones
                    rd = ws.row_dimensions[r]
                    rd.height = uniform_height
            except Exception:
                pass
        except Exception as e:
            print(f"Warning: could not create category charts: {e}")

    def _apply_sheet_fonts(self, ws):
        """Set header row fonts (bold size 20) and remaining populated rows font size 18.

        Preserves existing font colors (already applied for semantic coloring) by reusing the color attribute.
        """
        try:
            max_col = ws.max_column
            max_row = ws.max_row
            # Header row (row 1)
            for c in range(1, max_col + 1):
                cell = ws.cell(row=1, column=c)
                if cell.value in (None, ""):
                    continue
                prev_font = cell.font
                cell.font = Font(bold=True, size=20, color=getattr(prev_font, 'color', None))

            # Body rows
            for r in range(2, max_row + 1):
                # Skip entirely empty rows quickly
                if all(ws.cell(row=r, column=c).value in (None, "") for c in range(1, max_col + 1)):
                    continue
                for c in range(1, max_col + 1):
                    cell = ws.cell(row=r, column=c)
                    if cell.value in (None, ""):
                        continue
                    # Preserve Income title at K21 (row 21, col 11)
                    if r == 21 and c == 11 and cell.value == "Income":
                        # Ensure correct styling (in case previously downgraded)
                        prev_color = getattr(cell.font, 'color', None)
                        cell.font = Font(bold=True, size=20, color=prev_color)
                        continue
                    prev_font = cell.font
                    cell.font = Font(bold=False, size=18, color=getattr(prev_font, 'color', None))
            # Re-assert Income title styling explicitly (safety)
            try:
                income_cell = ws.cell(row=21, column=11)
                if income_cell.value == "Income":
                    prev_color = getattr(income_cell.font, 'color', None)
                    income_cell.font = Font(bold=True, size=20, color=prev_color)
            except Exception:
                pass
        except Exception as e:
            print(f"Font sizing error: {e}")

    def _find_next_transaction_row(self, ws):
        """Return the next row index for a new transaction.

        Ignores statistics in columns H/I so they don't create artificial gaps.
        Scans only columns 1..6 (A-F) for existing data rows.
        """
        last_data_row = 1  # header at row 1
        max_row = ws.max_row
        for r in range(2, max_row + 1):
            if any(ws.cell(row=r, column=c).value not in (None, "") for c in range(1, 7)):
                last_data_row = r
        return last_data_row + 1

    def _auto_adjust_transaction_columns(self, ws):
        """Auto size columns A-F based on content length with more generous widths.

        New adaptive rules (character-based Excel width units):
          A Date:           min 11, max 16 (dates fixed length but give breathing room)
          B Libellé:        min 20, soft target = max_len+2, hard max 80 (long labels)
          C Montant:        min 12, max 20 (allow larger numbers / decimals)
          D Catégorie:      min 16, max 32 (French words & accents)
          E Type:           min 10, max 16 ("Entrée" / "Sortie")
          F Prélèvement:    min 14, max 22 ("Oui" / "Non" plus header)

        Strategy:
          - Scan only data rows (A-F) ignoring stats area.
          - Compute max text length per column.
          - Add padding ( +2 or +3 for Libellé ).
          - Clamp inside new bounds.
          - If Libellé contains very long outliers ( > 70 chars ), cap at 80 but still wide.
        """
        config = {
            1: {"min": 11, "max": 16, "pad": 2},   # Date
            2: {"min": 20, "max": 80, "pad": 3},   # Libellé
            3: {"min": 12, "max": 20, "pad": 2},   # Montant
            4: {"min": 16, "max": 32, "pad": 2},   # Catégorie
            5: {"min": 10, "max": 16, "pad": 2},   # Type
            6: {"min": 14, "max": 22, "pad": 2},   # Prélèvement
        }

        last_data_row = self._find_next_transaction_row(ws) - 1
        if last_data_row < 1:
            return

        for col in range(1, 7):
            cfg = config[col]
            max_len = 0
            # Include header row for measuring
            for r in range(1, last_data_row + 1):
                val = ws.cell(row=r, column=col).value
                if val is None:
                    continue
                s = str(val)
                # For Montant, remove thousand separators just for width logic
                if col == 3:
                    s = s.replace('€', '').strip()
                length = len(s)
                if length > max_len:
                    max_len = length

            if max_len == 0:
                target = cfg["min"]
            else:
                target = max_len + cfg["pad"]

            # Special handling for Libellé: don't exceed hard max but allow wide content
            if col == 2 and max_len > 70:
                target = cfg["max"]

            # Clamp
            if target < cfg["min"]:
                target = cfg["min"]
            if target > cfg["max"]:
                target = cfg["max"]

            ws.column_dimensions[get_column_letter(col)].width = target
    def _apply_fixed_widths(self, ws):
        """Set fixed widths: A-F => 20, H=40, I=20, K=35 (chart/data area).

        Leaves other columns unchanged if present. Safe to call multiple times.
        """
        try:
            for col in range(1, 7):  # A-F
                ws.column_dimensions[get_column_letter(col)].width = 20
            # Stats columns H (8) & I (9)
            ws.column_dimensions[get_column_letter(8)].width = 40  # H
            ws.column_dimensions[get_column_letter(9)].width = 20  # I
            # Category chart source data column K (11)
            ws.column_dimensions[get_column_letter(11)].width = 30  # K
            ws.column_dimensions[get_column_letter(12)].width = 20  # L
            ws.column_dimensions[get_column_letter(13)].width = 12  # M
        except Exception as e:
            print(f"Fixed width error: {e}")

    def _normalize_date_column(self, ws):
        """Convert textual DD-MM-YYYY (or DD/MM/YYYY) values in column A to real date objects.

        Safe to run repeatedly; skips cells already recognized as dates.
        """
        pattern = re.compile(r"^(\d{2})[-/](\d{2})[-/](\d{4})$")
        for r in range(2, ws.max_row + 1):
            cell = ws.cell(row=r, column=1)
            val = cell.value
            if val is None:
                continue
            # If already a date/datetime, ensure number format and continue
            if isinstance(val, (datetime, date)):
                try:
                    cell.number_format = "dd/mm/yyyy"
                except Exception:
                    pass
                continue
            if isinstance(val, str):
                m = pattern.match(val.strip())
                if not m:
                    continue
                try:
                    # Accept either '-' or '/' as separator in stored text
                    norm = val.strip().replace('/', '-')
                    d = datetime.strptime(norm, "%d-%m-%Y").date()
                    cell.value = d
                    cell.number_format = "dd/mm/yyyy"
                except Exception:
                    continue

    def _on_date_entry_click(self):
        """Handle click on date entry - prevent immediate calendar closing"""
        self._calendar_opening = True
        self._open_calendar()
        # Reset flag after a short delay
        self.root.after(100, lambda: setattr(self, '_calendar_opening', False))

    def _open_calendar(self):
        if self.calendar_win is not None and self.calendar_win.winfo_exists():
            self.calendar_win.lift()
            return
        self.calendar_win = Toplevel(self.root)

        # Windows-compatible setup
        self.calendar_win.title("Select Date")
        self.calendar_win.resizable(False, False)
        self.calendar_win.transient(self.root)

        # Try to set topmost, but don't fail if it doesn't work on Windows
        try:
            self.calendar_win.attributes("-topmost", True)
        except Exception:
            pass

        self._sync_calendar_to_entry()
        self._position_calendar()
        self._build_calendar_header()
        self._build_calendar_body()
        self._refresh_calendar_theme()

        # Set focus and grab on Windows
        try:
            self.calendar_win.focus_set()
            self.calendar_win.grab_set()
        except Exception:
            pass

        self.calendar_win.bind("<Escape>", lambda e: self._close_calendar())

        # Additional Windows focus handling
        self.calendar_win.bind("<FocusOut>", self._on_calendar_focus_out)

    def _position_calendar(self):
        if self.date_entry is None:
            return

        # Force window updates to ensure accurate positioning
        self.root.update_idletasks()
        self.calendar_win.update_idletasks()

        # Small delay to ensure widgets are properly rendered
        self.root.after(1, self._do_position_calendar)

    def _do_position_calendar(self):
        if self.calendar_win is None or not self.calendar_win.winfo_exists():
            return

        # Get entry field position
        x = self.date_entry.winfo_rootx()
        y = self.date_entry.winfo_rooty() + self.date_entry.winfo_height()

        # Adjust for Windows DPI and screen boundaries
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        # Calendar dimensions
        cal_width = 260
        cal_height = 250

        # Ensure calendar stays on screen
        if x + cal_width > screen_width:
            x = screen_width - cal_width - 10
        if y + cal_height > screen_height:
            y = self.date_entry.winfo_rooty() - cal_height

        self.calendar_win.geometry(f"{cal_width}x{cal_height}+{x}+{y}")

    def _build_calendar_header(self):
        for child in self.calendar_win.winfo_children():
            child.destroy()

        theme = self.current_theme
        header = Frame(self.calendar_win, bg=theme["bg"])
        header.pack(fill="x", pady=4)

        prev_btn = Button(
            header,
            text="◀",
            width=2,
            command=self._prev_month,
            relief="flat",
            borderwidth=0,
            bg=theme["entry_bg"],
            fg=theme["entry_fg"],
            activebackground=theme["toggle_track"],
            activeforeground=theme["toggle_thumb"]
        )
        prev_btn.pack(side="left", padx=4)

        next_btn = Button(
            header,
            text="▶",
            width=2,
            command=self._next_month,
            relief="flat",
            borderwidth=0,
            bg=theme["entry_bg"],
            fg=theme["entry_fg"],
            activebackground=theme["toggle_track"],
            activeforeground=theme["toggle_thumb"]
        )
        next_btn.pack(side="right", padx=4)

        month_label = Label(
            header,
            text=f"{_calendar.month_name[self._calendar_month]} {self._calendar_year}",
            anchor="center",
            bg=theme["bg"],
            fg=theme["fg"]
        )
        month_label.pack(fill="x")
        self._calendar_header_widgets = (header, prev_btn, next_btn, month_label)

    def _build_calendar_body(self):
        existing = getattr(self, "_calendar_day_frame", None)
        if existing and existing.winfo_exists():
            existing.destroy()

        theme = self.current_theme
        day_frame = Frame(self.calendar_win, bg=theme["bg"])
        day_frame.pack(fill="both", expand=True, padx=6, pady=(0, 6))
        self._calendar_day_frame = day_frame

        # Day headers
        for idx, wd in enumerate(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]):
            lbl = Label(
                day_frame,
                text=wd,
                anchor="center",
                bg=theme["bg"],
                fg=theme["fg"]
            )
            lbl.grid(row=0, column=idx, padx=2, pady=2, sticky="nsew")

        for c in range(7):
            day_frame.grid_columnconfigure(c, weight=1, uniform="day")

        first_wd, days_in_month = _calendar.monthrange(self._calendar_year, self._calendar_month)
        row = 1
        col = first_wd

        for d in range(1, days_in_month + 1):
            current_date = date(self._calendar_year, self._calendar_month, d)
            ds_display = current_date.strftime("%d-%m-%Y")
            is_selected = self._selected_date == current_date

            if is_selected:
                btn = Button(
                    day_frame,
                    text=str(d),
                    width=2,
                    relief="flat",
                    borderwidth=0,
                    command=lambda ds=ds_display: self._select_date(ds),
                    bg=theme["toggle_track_active"],
                    fg=theme["toggle_thumb"],
                    activebackground=theme["toggle_track_active"],
                    activeforeground=theme["toggle_thumb"]
                )
                btn._is_selected = True
            else:
                btn = Button(
                    day_frame,
                    text=str(d),
                    width=2,
                    relief="flat",
                    borderwidth=0,
                    command=lambda ds=ds_display: self._select_date(ds),
                    bg=theme["entry_bg"],
                    fg=theme["entry_fg"],
                    activebackground=theme["toggle_track"],
                    activeforeground=theme["toggle_thumb"]
                )

            btn.grid(row=row, column=col, padx=1, pady=1, sticky="nsew")
            col += 1
            if col > 6:
                col = 0
                row += 1

        for r in range(row + 1):
            day_frame.grid_rowconfigure(r, weight=1)

    def _select_date(self, ds: str):
        self.date_var.set(ds)
        try:
            self._selected_date = datetime.strptime(ds, "%d-%m-%Y").date()
        except Exception:
            self._selected_date = None
        if self.calendar_win and self.calendar_win.winfo_exists():
            self._build_calendar_body()
            self._refresh_calendar_theme()
        self._close_calendar()

    def _sync_calendar_to_entry(self):
        value = self.date_var.get().strip()
        try:
            dt = datetime.strptime(value, "%d-%m-%Y")
            self._calendar_year = dt.year
            self._calendar_month = dt.month
            self._selected_date = dt.date()
        except Exception:
            today = date.today()
            self._calendar_year = today.year
            self._calendar_month = today.month
            self._selected_date = None

    def _prev_month(self):
        if self._calendar_month == 1:
            self._calendar_month = 12
            self._calendar_year -= 1
        else:
            self._calendar_month -= 1
        self._build_calendar_header()
        self._build_calendar_body()
        self._refresh_calendar_theme()

    def _next_month(self):
        if self._calendar_month == 12:
            self._calendar_month = 1
            self._calendar_year += 1
        else:
            self._calendar_month += 1
        self._build_calendar_header()
        self._build_calendar_body()
        self._refresh_calendar_theme()

    def _refresh_calendar_theme(self):
        if self.calendar_win is None or not self.calendar_win.winfo_exists():
            return
        theme = self.current_theme
        self.calendar_win.configure(bg=theme["bg"])

        header_widgets = getattr(self, "_calendar_header_widgets", ())
        if len(header_widgets) >= 4:
            header, prev_btn, next_btn, month_label = header_widgets
            try:
                header.configure(bg=theme["bg"])
                prev_btn.configure(
                    bg=theme["entry_bg"],
                    fg=theme["entry_fg"],
                    activebackground=theme["toggle_track"],
                    activeforeground=theme["toggle_thumb"]
                )
                next_btn.configure(
                    bg=theme["entry_bg"],
                    fg=theme["entry_fg"],
                    activebackground=theme["toggle_track"],
                    activeforeground=theme["toggle_thumb"]
                )
                month_label.configure(bg=theme["bg"], fg=theme["fg"])
            except Exception:
                pass

        day_frame = getattr(self, "_calendar_day_frame", None)
        if day_frame is not None:
            day_frame.configure(bg=theme["bg"])
            for child in day_frame.winfo_children():
                try:
                    if isinstance(child, Label):
                        child.configure(bg=theme["bg"], fg=theme["fg"])
                    elif isinstance(child, Button):
                        if getattr(child, "_is_selected", False):
                            child.configure(
                                bg=theme["toggle_track_active"],
                                fg=theme["toggle_thumb"],
                                activebackground=theme["toggle_track_active"],
                                activeforeground=theme["toggle_thumb"]
                            )
                        else:
                            child.configure(
                                bg=theme["entry_bg"],
                                fg=theme["entry_fg"],
                                activebackground=theme["toggle_track"],
                                activeforeground=theme["toggle_thumb"]
                            )
                except Exception:
                    pass

    def _close_calendar(self):
        if self.calendar_win is not None:
            try:
                self.calendar_win.destroy()
            except Exception:
                pass
            self.calendar_win = None

    def _on_calendar_focus_out(self, event):
        self.root.after(100, self._check_calendar_focus)

    def _check_calendar_focus(self):
        if self.calendar_win is None or not self.calendar_win.winfo_exists():
            return
        try:
            focused = self.root.focus_get()
            if focused is None or str(focused).find(str(self.calendar_win)) == -1:
                if not str(focused).find(str(self.date_entry)) >= 0:
                    self._close_calendar()
        except Exception:
            pass

    def _maybe_close_calendar(self, event):
        if self.calendar_win is None or not self.calendar_win.winfo_exists():
            return

        if getattr(self, '_calendar_opening', False):
            return

        widget = event.widget

        if widget is self.date_entry:
            return

        try:
            current_widget = widget
            while current_widget:
                if current_widget == self.calendar_win:
                    return
                try:
                    current_widget = current_widget.master
                except AttributeError:
                    break

            widget_path = str(widget)
            calendar_path = str(self.calendar_win)
            if widget_path.startswith(calendar_path):
                return

        except Exception:
            pass

        self._close_calendar()


if __name__ == "__main__":
    root = Tk()
    app = App(root)

    root.bind("<Escape>", lambda e: root.quit())
    root.mainloop()
