"""ContentAI — GUI
4-agent content pipeline with dark terminal aesthetic.
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
import threading
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── Colors ────────────────────────────────────────────────
BG       = "#0d1117"
PANEL    = "#161b22"
BORDER   = "#30363d"
ACCENT   = "#58a6ff"
GREEN    = "#3fb950"
RED      = "#f85149"
YELLOW   = "#d29922"
TEXT     = "#e6edf3"
MUTED    = "#8b949e"
ENTRY_BG = "#21262d"
FONT     = ("JetBrains Mono", 12) if sys.platform == "darwin" else ("Courier New", 11)
FONT_SM  = (FONT[0], 10)
FONT_LG  = (FONT[0], 16, "bold")


def apply_theme(root):
    style = ttk.Style(root)
    style.theme_use("clam")
    style.configure("TFrame", background=BG)
    style.configure("TLabel", background=BG, foreground=TEXT, font=FONT)
    style.configure("TButton", background=PANEL, foreground=TEXT, font=FONT,
                    borderwidth=1, relief="flat", padding=6)
    style.map("TButton",
              background=[("active", BORDER), ("pressed", ACCENT)],
              foreground=[("active", TEXT)])
    style.configure("Accent.TButton", background=ACCENT, foreground=BG, font=(FONT[0], 12, "bold"))
    style.map("Accent.TButton", background=[("active", "#79c0ff")])
    style.configure("TEntry", fieldbackground=ENTRY_BG, foreground=TEXT,
                    insertcolor=TEXT, borderwidth=1)
    style.configure("TNotebook", background=BG, borderwidth=0)
    style.configure("TNotebook.Tab", background=PANEL, foreground=MUTED,
                    font=FONT_SM, padding=[12, 6])
    style.map("TNotebook.Tab",
              background=[("selected", BG)],
              foreground=[("selected", ACCENT)])
    style.configure("TLabelframe", background=BG, foreground=MUTED,
                    bordercolor=BORDER, relief="flat")
    style.configure("TLabelframe.Label", background=BG, foreground=MUTED, font=FONT_SM)
    style.configure("Treeview", background=PANEL, fieldbackground=PANEL,
                    foreground=TEXT, font=FONT_SM, rowheight=24)
    style.configure("Treeview.Heading", background=BORDER, foreground=MUTED, font=FONT_SM)
    style.map("Treeview", background=[("selected", ACCENT)], foreground=[("selected", BG)])
    root.option_add("*TCombobox*Listbox.background", ENTRY_BG)
    root.option_add("*TCombobox*Listbox.foreground", TEXT)
    root.option_add("*TCombobox*Listbox.selectBackground", ACCENT)
    root.configure(bg=BG)


class ContentAI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("ContentAI — 4-Agent Pipeline")
        self.geometry("1100x780")
        self.minsize(900, 650)
        self.configure(bg=BG)
        apply_theme(self)

        self._build_header()
        self._build_tabs()
        self._build_status()

        self._load_config()

    # ── Header ────────────────────────────────────────────
    def _build_header(self):
        hdr = tk.Frame(self, bg=PANEL, height=56)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)

        tk.Label(hdr, text="◈ CONTENT", bg=PANEL, fg=ACCENT,
                 font=(FONT[0], 18, "bold")).pack(side="left", padx=(20, 0), pady=12)
        tk.Label(hdr, text="AI", bg=PANEL, fg=TEXT,
                 font=(FONT[0], 18, "bold")).pack(side="left", pady=12)
        tk.Label(hdr, text="  4-Agent Pipeline", bg=PANEL, fg=MUTED,
                 font=FONT_SM).pack(side="left", pady=16)

        self.run_btn = ttk.Button(hdr, text="▶  RUN PIPELINE",
                                  style="Accent.TButton", command=self._run_pipeline)
        self.run_btn.pack(side="right", padx=20, pady=10)

    # ── Tabs ──────────────────────────────────────────────
    def _build_tabs(self):
        self.nb = ttk.Notebook(self)
        self.nb.pack(fill="both", expand=True, padx=0, pady=0)

        self._tab_config()
        self._tab_scraper()
        self._tab_validator()
        self._tab_writer()
        self._tab_hooks()
        self._tab_log()

    # ── Tab: Config ───────────────────────────────────────
    def _tab_config(self):
        f = ttk.Frame(self.nb)
        self.nb.add(f, text="⚙  Config")

        canvas = tk.Canvas(f, bg=BG, highlightthickness=0)
        canvas.pack(fill="both", expand=True, padx=30, pady=20)
        inner = tk.Frame(canvas, bg=BG)
        canvas.create_window((0, 0), window=inner, anchor="nw")

        def row(label, var, show=""):
            r = tk.Frame(inner, bg=BG)
            r.pack(fill="x", pady=6)
            tk.Label(r, text=label, bg=BG, fg=MUTED, font=FONT_SM, width=22, anchor="w").pack(side="left")
            e = tk.Entry(r, textvariable=var, bg=ENTRY_BG, fg=TEXT, insertbackground=TEXT,
                         font=FONT, relief="flat", bd=6, show=show)
            e.pack(side="left", fill="x", expand=True)
            return e

        tk.Label(inner, text="API Keys", bg=BG, fg=ACCENT, font=FONT_LG).pack(anchor="w", pady=(0, 8))
        self.v_apify  = tk.StringVar()
        self.v_anthro = tk.StringVar()
        row("Apify Token", self.v_apify, show="•")
        row("Anthropic API Key (optional)", self.v_anthro, show="•")

        sep(inner)
        tk.Label(inner, text="Handles", bg=BG, fg=ACCENT, font=FONT_LG).pack(anchor="w", pady=(0, 8))
        self.v_ig  = tk.StringVar()
        self.v_tw  = tk.StringVar()
        self.v_yt  = tk.StringVar()
        row("Instagram", self.v_ig)
        row("Twitter/X", self.v_tw)
        row("YouTube",   self.v_yt)

        sep(inner)
        tk.Label(inner, text="Content Settings", bg=BG, fg=ACCENT, font=FONT_LG).pack(anchor="w", pady=(0, 8))
        self.v_keywords = tk.StringVar()
        self.v_topic    = tk.StringVar()
        row("Keywords (comma-separated)", self.v_keywords)
        row("Today's Topic (optional)", self.v_topic)

        sep(inner)
        save_btn = ttk.Button(inner, text="Save Config", command=self._save_config)
        save_btn.pack(anchor="w", pady=10)

    # ── Tab: Scraper ──────────────────────────────────────
    def _tab_scraper(self):
        f = ttk.Frame(self.nb)
        self.nb.add(f, text="01  Scraper")

        cols = ("Platform", "Format", "Hook", "Views", "ER%", "Viral")
        self.scraper_tree = self._make_tree(f, cols,
                                            widths=[90, 70, 400, 100, 60, 60])

    # ── Tab: Validator ────────────────────────────────────
    def _tab_validator(self):
        f = ttk.Frame(self.nb)
        self.nb.add(f, text="02  Validator")

        top = tk.Frame(f, bg=BG)
        top.pack(fill="x", padx=16, pady=12)

        self.rec_label = tk.Label(top, text="Recommendation will appear here",
                                  bg=PANEL, fg=ACCENT, font=(FONT[0], 13, "bold"),
                                  anchor="w", padx=12, pady=8, relief="flat")
        self.rec_label.pack(fill="x")

        cols = ("Topic", "Posts", "Avg Views", "Avg ER%", "Viral", "Sustained")
        self.val_tree = self._make_tree(f, cols, widths=[150, 60, 120, 80, 60, 90])

    # ── Tab: Script ───────────────────────────────────────
    def _tab_writer(self):
        f = ttk.Frame(self.nb)
        self.nb.add(f, text="03  Script")

        bar = tk.Frame(f, bg=BG)
        bar.pack(fill="x", padx=16, pady=(12, 4))
        ttk.Button(bar, text="Save Script", command=self._save_script).pack(side="right")
        tk.Label(bar, text="Generated Script", bg=BG, fg=MUTED, font=FONT_SM).pack(side="left")

        self.script_box = scrolledtext.ScrolledText(
            f, bg=PANEL, fg=TEXT, insertbackground=TEXT, font=FONT,
            relief="flat", bd=0, wrap="word", padx=12, pady=10)
        self.script_box.pack(fill="both", expand=True, padx=16, pady=(0, 16))

    # ── Tab: Hooks ────────────────────────────────────────
    def _tab_hooks(self):
        f = ttk.Frame(self.nb)
        self.nb.add(f, text="04  Hooks")

        bar = tk.Frame(f, bg=BG)
        bar.pack(fill="x", padx=16, pady=(12, 4))
        ttk.Button(bar, text="Save Hooks", command=self._save_hooks).pack(side="right")
        tk.Label(bar, text="5 Hook Variations", bg=BG, fg=MUTED, font=FONT_SM).pack(side="left")

        self.hooks_box = scrolledtext.ScrolledText(
            f, bg=PANEL, fg=TEXT, insertbackground=TEXT, font=FONT,
            relief="flat", bd=0, wrap="word", padx=12, pady=10)
        self.hooks_box.pack(fill="both", expand=True, padx=16, pady=(0, 16))

    # ── Tab: Log ──────────────────────────────────────────
    def _tab_log(self):
        f = ttk.Frame(self.nb)
        self.nb.add(f, text="  Log")

        bar = tk.Frame(f, bg=BG)
        bar.pack(fill="x", padx=16, pady=(12, 4))
        ttk.Button(bar, text="Clear", command=self._clear_log).pack(side="right")
        tk.Label(bar, text="Pipeline Log", bg=BG, fg=MUTED, font=FONT_SM).pack(side="left")

        self.log_box = scrolledtext.ScrolledText(
            f, bg="#010409", fg=GREEN, insertbackground=TEXT, font=FONT_SM,
            relief="flat", bd=0, padx=12, pady=10)
        self.log_box.pack(fill="both", expand=True, padx=16, pady=(0, 16))
        self.log_box.tag_config("err", foreground=RED)
        self.log_box.tag_config("warn", foreground=YELLOW)
        self.log_box.tag_config("accent", foreground=ACCENT)

    # ── Status bar ────────────────────────────────────────
    def _build_status(self):
        bar = tk.Frame(self, bg=PANEL, height=28)
        bar.pack(fill="x", side="bottom")
        bar.pack_propagate(False)
        self.status_var = tk.StringVar(value="Ready")
        tk.Label(bar, textvariable=self.status_var, bg=PANEL, fg=MUTED,
                 font=FONT_SM, anchor="w").pack(side="left", padx=12)
        self.progress = ttk.Progressbar(bar, mode="indeterminate", length=160)
        self.progress.pack(side="right", padx=12, pady=4)

    # ── Helpers ───────────────────────────────────────────
    def _make_tree(self, parent, cols, widths=None):
        frame = tk.Frame(parent, bg=BG)
        frame.pack(fill="both", expand=True, padx=16, pady=12)

        sb = ttk.Scrollbar(frame, orient="vertical")
        tree = ttk.Treeview(frame, columns=cols, show="headings",
                             yscrollcommand=sb.set)
        sb.config(command=tree.yview)
        sb.pack(side="right", fill="y")
        tree.pack(fill="both", expand=True)

        for i, col in enumerate(cols):
            w = widths[i] if widths and i < len(widths) else 100
            tree.heading(col, text=col)
            tree.column(col, width=w, minwidth=40, anchor="w")

        tree.tag_configure("viral", foreground=YELLOW)
        return tree

    def _log(self, msg, tag=""):
        self.log_box.insert("end", msg + "\n", tag)
        self.log_box.see("end")
        self.update_idletasks()

    def _clear_log(self):
        self.log_box.delete("1.0", "end")

    def _set_status(self, msg):
        self.status_var.set(msg)
        self.update_idletasks()

    # ── Config persistence ────────────────────────────────
    def _load_config(self):
        try:
            from dotenv import dotenv_values
            env = dotenv_values(".env")
            self.v_apify.set(env.get("APIFY_TOKEN", ""))
            self.v_anthro.set(env.get("ANTHROPIC_API_KEY", ""))
        except Exception:
            pass
        try:
            from config import HANDLES, KEYWORDS
            self.v_ig.set(HANDLES.get("instagram", ""))
            self.v_tw.set(HANDLES.get("twitter", ""))
            self.v_yt.set(HANDLES.get("youtube", ""))
            self.v_keywords.set(", ".join(KEYWORDS))
        except Exception:
            pass

    def _save_config(self):
        # Update .env
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        with open(env_path, "w") as f:
            f.write(f"APIFY_TOKEN={self.v_apify.get()}\n")
            f.write(f"ANTHROPIC_API_KEY={self.v_anthro.get()}\n")
        # Update config.py handles/keywords
        import config
        config.APIFY_TOKEN = self.v_apify.get()
        config.ANTHROPIC_API_KEY = self.v_anthro.get()
        config.HANDLES = {
            "instagram": self.v_ig.get(),
            "twitter":   self.v_tw.get(),
            "youtube":   self.v_yt.get(),
        }
        config.KEYWORDS = [k.strip() for k in self.v_keywords.get().split(",") if k.strip()]
        os.environ["APIFY_TOKEN"] = self.v_apify.get()
        os.environ["ANTHROPIC_API_KEY"] = self.v_anthro.get()
        messagebox.showinfo("Saved", "Config saved successfully.")

    # ── Save outputs ──────────────────────────────────────
    def _save_script(self):
        path = filedialog.asksaveasfilename(defaultextension=".md",
                                            filetypes=[("Markdown", "*.md"), ("Text", "*.txt")])
        if path:
            with open(path, "w") as f:
                f.write(self.script_box.get("1.0", "end"))

    def _save_hooks(self):
        path = filedialog.asksaveasfilename(defaultextension=".md",
                                            filetypes=[("Markdown", "*.md"), ("Text", "*.txt")])
        if path:
            with open(path, "w") as f:
                f.write(self.hooks_box.get("1.0", "end"))

    # ── Pipeline ──────────────────────────────────────────
    def _run_pipeline(self):
        self.run_btn.config(state="disabled")
        self.progress.start(10)
        self._set_status("Running pipeline...")
        self.nb.select(5)  # switch to log tab
        self._log("=" * 50, "accent")
        self._log("  CONTENT AI — PIPELINE STARTED", "accent")
        self._log("=" * 50, "accent")
        t = threading.Thread(target=self._pipeline_thread, daemon=True)
        t.start()

    def _pipeline_thread(self):
        try:
            import importlib
            import config as cfg

            # Sync runtime config from GUI
            cfg.APIFY_TOKEN  = self.v_apify.get() or cfg.APIFY_TOKEN
            cfg.ANTHROPIC_API_KEY = self.v_anthro.get() or cfg.ANTHROPIC_API_KEY
            os.environ["APIFY_TOKEN"] = cfg.APIFY_TOKEN
            os.environ["ANTHROPIC_API_KEY"] = cfg.ANTHROPIC_API_KEY
            keywords_raw = self.v_keywords.get()
            if keywords_raw:
                cfg.KEYWORDS = [k.strip() for k in keywords_raw.split(",") if k.strip()]

            from agents import scraper, validator, writer, hooks
            for mod in [scraper, validator, writer, hooks]:
                importlib.reload(mod)

            # Agent 01
            self._set_status("Agent 01: Scraping...")
            posts = scraper.run(log=self._log)
            self.after(0, self._populate_scraper, posts)

            # Agent 02
            self._set_status("Agent 02: Validating...")
            validated = validator.run(posts, log=self._log)
            self.after(0, self._populate_validator, validated)

            # Agent 03
            self._set_status("Agent 03: Writing script...")
            topic = self.v_topic.get() or None
            script = writer.run(validated, topic_override=topic, log=self._log)
            self.after(0, self._show_script, script)

            # Agent 04
            self._set_status("Agent 04: Generating hooks...")
            hook_text = hooks.run(validated, script=script, topic_override=topic, log=self._log)
            self.after(0, self._show_hooks, hook_text)

            self._log("=" * 50, "accent")
            self._log("  PIPELINE COMPLETE ✓", "accent")
            self._log("=" * 50, "accent")
            self.after(0, self._done)
        except Exception as e:
            self._log(f"\nERROR: {e}", "err")
            import traceback
            self._log(traceback.format_exc(), "err")
            self.after(0, self._done)

    def _done(self):
        self.progress.stop()
        self.run_btn.config(state="normal")
        self._set_status("Done")

    # ── Populate results ──────────────────────────────────
    def _populate_scraper(self, posts):
        for row in self.scraper_tree.get_children():
            self.scraper_tree.delete(row)
        for p in posts:
            tag = "viral" if p.get("viral") else ""
            viral_label = "VIRAL" if p.get("viral") else ""
            self.scraper_tree.insert("", "end", values=(
                p.get("platform", ""),
                p.get("format", ""),
                p.get("hook", "")[:80],
                f"{p.get('views', 0):,}",
                f"{p.get('engagement_rate', 0):.1f}%",
                viral_label,
            ), tags=(tag,))
        self.nb.select(1)

    def _populate_validator(self, validated):
        for row in self.val_tree.get_children():
            self.val_tree.delete(row)
        for t in validated.get("ranked_topics", []):
            self.val_tree.insert("", "end", values=(
                t["topic"],
                t["post_count"],
                f"{t['avg_views']:,}",
                f"{t['avg_er']}%",
                t["viral_count"],
                "YES" if t["sustained"] else "",
            ))
        rec = validated.get("recommended_topic", {})
        self.rec_label.config(
            text=f"▶  Recommended: {rec.get('topic', '—').upper()}  |  Avg views: {rec.get('avg_views', 0):,}")

    def _show_script(self, script):
        self.script_box.delete("1.0", "end")
        self.script_box.insert("1.0", script)
        self.nb.select(3)

    def _show_hooks(self, hook_text):
        self.hooks_box.delete("1.0", "end")
        self.hooks_box.insert("1.0", hook_text)


def sep(parent):
    tk.Frame(parent, bg=BORDER, height=1).pack(fill="x", pady=12)


if __name__ == "__main__":
    app = ContentAI()
    app.mainloop()
