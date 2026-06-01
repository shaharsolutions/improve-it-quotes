#!/usr/bin/env python3
import sys
from pathlib import Path

import fitz


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: fix-pdf-links.py <pdf-path>")

    pdf_path = Path(sys.argv[1])
    doc = fitz.open(pdf_path)
    converted = 0

    for page in doc:
        links = page.get_links()
        replacements = []

        for link in links:
            target_page = link.get("page", -1)
            target_point = link.get("to")
            source_rect = link.get("from")

            if target_page is None or target_page < 0 or source_rect is None:
                continue

            replacements.append(
                {
                    "old": link,
                    "new": {
                        "kind": fitz.LINK_GOTO,
                        "from": source_rect,
                        "page": target_page,
                        "to": target_point or fitz.Point(0, 0),
                        "zoom": link.get("zoom", 0),
                    },
                }
            )

        for replacement in replacements:
            page.delete_link(replacement["old"])

        for replacement in replacements:
            page.insert_link(replacement["new"])
            converted += 1

    if converted:
        temp_path = pdf_path.with_suffix(".linked.tmp.pdf")
        doc.save(temp_path, garbage=4, deflate=True)
        doc.close()
        temp_path.replace(pdf_path)
    else:
        doc.close()

    print(f"converted_links={converted}")


if __name__ == "__main__":
    main()
