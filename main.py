from pathlib import Path
from datetime import date, datetime
import calendar as _calendar
from tkinter import (
    Button,
    Canvas,
    Entry,
    Frame,
    Label,
    PhotoImage,
    StringVar,
    Tk,
    TclError,
    Toplevel,
)
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
        self.montant_var = StringVar()
        self.amount_validator = self.root.register(self._validate_amount)
        self.transaction_is_entry = False
        self.transaction_container = None
        self.date_var = StringVar(value=date.today().strftime("%d-%m-%Y"))
        self.date_entry = None
        self.calendar_win = None
        self._calendar_year = date.today().year
        self._calendar_month = date.today().month
        self._selected_date = None  # Track the selected date for highlighting

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

        for i in range(3):
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
        self.date_entry.bind("<Button-1>", lambda e: self._open_calendar())
        self.entries.append(self.date_entry)

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
        montant_entry.grid(row=1, column=1, sticky="new", padx=10, pady=(0, 8), ipady=4)
        self.entries.append(montant_entry)

        self.category_combobox = ttk.Combobox(
            self.entry_frame,
            textvariable=self.category_var,
            values=CATEGORY_VALUES,
            state="readonly",
            style=self.combobox_style,
            exportselection=False,
        )
        self.category_combobox.grid(row=1, column=2, sticky="new", padx=10, pady=(0, 8))
        self.category_combobox.configure(font=self.entry_font)
        self.category_combobox.bind("<<ComboboxSelected>>", self._clear_category_selection)
        self.category_combobox.bind("<FocusOut>", self._clear_category_selection)

        self.transaction_container = Frame(self.entry_frame, bg=LIGHT_THEME["bg"])
        self.transaction_container.grid(row=2, column=1, pady=(2, 0))

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
        self.add_button.grid(row=3, column=0, columnspan=3, pady=(20, 0))

        self.apply_theme()
        self._update_fonts()
        self._clear_category_selection()
        self._render_transaction_toggle(LIGHT_THEME)

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
            entry.configure(
                bg=theme["entry_bg"],
                fg=theme["entry_fg"],
                insertbackground=theme["entry_fg"],
                highlightbackground=theme["entry_border"],
                highlightcolor=theme["entry_border"],
            )

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

        self._render_transaction_toggle(theme)
        self._refresh_calendar_theme()

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
        self._render_transaction_toggle(self.current_theme)
        if self.calendar_win is not None:
            self._build_calendar_body()

    def _add_row(self):
        """Handle adding a new row with the current form data"""
        # Get the form data
        date_value = self.date_var.get().strip()
        montant_value = self.montant_var.get().strip()
        category_value = self.category_var.get().strip()
        transaction_type = "Entrée" if self.transaction_is_entry else "Sortie"

        # Basic validation
        if not date_value:
            print("Date is required")
            return
        if not montant_value:
            print("Montant is required")
            return
        if not category_value:
            print("Catégorie is required")
            return

        # For now, just print the data (you can extend this to save to file/database)
        print(f"Adding row: Date={date_value}, Montant={montant_value}, Catégorie={category_value}, Type={transaction_type}")

        # Clear the form after adding
        self.montant_var.set("")
        self.category_var.set("")
        # Keep the date as it might be reused

        # Clear category selection
        self._clear_category_selection()

    def toggle_theme(self):
        self.is_dark_mode = not self.is_dark_mode
        self.apply_theme()

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
                # Selected date - green highlighting
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
                # Regular day buttons
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
        # Update the selected date for highlighting
        try:
            self._selected_date = datetime.strptime(ds, "%d-%m-%Y").date()
        except Exception:
            self._selected_date = None
        # Refresh the calendar to update highlighting
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
            self._selected_date = dt.date()  # Set the selected date for highlighting
        except Exception:
            # If parsing fails, default to today but don't highlight anything
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

        # Apply theme to header widgets
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

        # Apply theme to day frame and day buttons
        day_frame = getattr(self, "_calendar_day_frame", None)
        if day_frame is not None:
            day_frame.configure(bg=theme["bg"])
            for child in day_frame.winfo_children():
                try:
                    if isinstance(child, Label):
                        # Day headers (Mo, Tu, etc.)
                        child.configure(bg=theme["bg"], fg=theme["fg"])
                    elif isinstance(child, Button):
                        # Day buttons
                        if getattr(child, "_is_selected", False):
                            # Selected date - green highlighting
                            child.configure(
                                bg=theme["toggle_track_active"],
                                fg=theme["toggle_thumb"],
                                activebackground=theme["toggle_track_active"],
                                activeforeground=theme["toggle_thumb"]
                            )
                        else:
                            # Regular day buttons
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
        # Small delay to allow for click events to register
        self.root.after(100, self._check_calendar_focus)

    def _check_calendar_focus(self):
        if self.calendar_win is None or not self.calendar_win.winfo_exists():
            return
        try:
            focused = self.root.focus_get()
            if focused is None or str(focused).find(str(self.calendar_win)) == -1:
                # Focus is outside calendar window
                if not str(focused).find(str(self.date_entry)) >= 0:
                    self._close_calendar()
        except Exception:
            pass

    def _maybe_close_calendar(self, event):
        if self.calendar_win is None or not self.calendar_win.winfo_exists():
            return

        widget = event.widget

        # Don't close if clicking inside calendar window
        try:
            # Check if the widget is part of the calendar window hierarchy
            current_widget = widget
            while current_widget:
                try:
                    current_widget = current_widget.master
                except AttributeError:
                    break

            # Also check by widget path string as backup
            widget_path = str(widget)
            calendar_path = str(self.calendar_win)
            if widget_path.startswith(calendar_path):
                return

        except Exception as e:
            pass

        self._close_calendar()


if __name__ == "__main__":
    root = Tk()
    app = App(root)

    root.bind("<Escape>", lambda e: root.quit())
    root.mainloop()
