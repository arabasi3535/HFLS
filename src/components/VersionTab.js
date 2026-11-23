import { Fragment, useState } from "react";
import LOG from "../changelog.json";

// ============================================================
// 사용 안내 › 버전 정보 — README.md 「## vX 변경사항」 절을 빌드 때 src/changelog.json으로 정리(scripts/changelog.js)
//  새 버전은 README 맨 위에 절을 추가하면 자동으로 목차·목록에 들어감
// ============================================================

/** **굵게**·`코드`·줄바꿈만 처리(HTML 직접 삽입 없음) */
export function Inline({ s }) {
  const lines = String(s || "").split("\n");
  return lines.map((ln, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {ln.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
          <code key={i}>{p.slice(1, -1)}</code>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </Fragment>
  ));
}

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    if (b.t === "tbl")
      return (
        <div key={i} className="table-wrap">
          <table className="review vi-tbl">
            <thead>
              <tr>
                {b.h.map((h, j) => (
                  <th key={j}>
                    <Inline s={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.r.map((r, k) => (
                <tr key={k}>
                  {b.h.map((_, j) => (
                    <td key={j}>
                      <Inline s={r[j] || ""} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    if (b.t === "ul" || b.t === "ol") {
      const L = b.t;
      return (
        <L key={i} className="vi-list">
          {b.i.map((it, j) => (
            <li key={j}>
              <Inline s={it.s} />
              {it.c && (
                <ul>
                  {it.c.map((c, k) => (
                    <li key={k}>
                      <Inline s={c.s} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </L>
      );
    }
    if (b.t === "h")
      return (
        <div key={i} className="vi-h">
          <Inline s={b.s} />
        </div>
      );
    if (b.t === "q")
      return (
        <blockquote key={i} className="vi-q">
          <Inline s={b.s} />
        </blockquote>
      );
    return (
      <p key={i} className="vi-p">
        <Inline s={b.s} />
      </p>
    );
  });
}

const idOf = (v) => "ver-" + v.replace(/\./g, "-");

const fmtDate = (d) => (d ? d.replace(/-/g, ".") + "." : "");

export default function VersionTab({ log = LOG }) {
  const [open, setOpen] = useState(() => new Set(log.length ? [log[0].v] : []));
  const toggle = (v) =>
    setOpen((p) => {
      const n = new Set(p);
      if (n.has(v)) n.delete(v);
      else n.add(v);
      return n;
    });
  const allOpen = log.length > 0 && open.size === log.length;
  const first = log[log.length - 1];
  return (
    <div className="card prose vi">
      <div className="vi-top">
        <div>
          <div className="card-t">버전 정보</div>
          <div className="vi-meta">
            현재 <b>v{log[0] ? log[0].v : "-"}</b> · 변경 기록 {log.length}개{first && first.date ? ` · ${fmtDate(first.date)} ~ ${fmtDate(log[0].date)}` : ""}
          </div>
        </div>
        <div className="vi-btns">
          <button type="button" className="btn small" disabled={allOpen} onClick={() => setOpen(new Set(log.map((x) => x.v)))}>
            전체 펼치기
          </button>
          <button type="button" className="btn small" disabled={!open.size} onClick={() => setOpen(new Set())}>
            전체 접기
          </button>
        </div>
      </div>
      <div className="vi-rule">버전 규칙: 큰 기능 추가·대규모 점검은 가운데 번호(2.<b>43</b>.0), 세부 수정은 끝 번호(2.43.<b>1</b>)를 올립니다.</div>

      <div className="vi-items">
        {log.map((x) => {
          const on = open.has(x.v);
          return (
            <section key={x.v} id={idOf(x.v)} className={"vi-item" + (on ? " open" : "")}>
              <button type="button" className="vi-sum" aria-expanded={on} onClick={() => toggle(x.v)}>
                <span className="vi-arrow">{on ? "▾" : "▸"}</span>
                <b className="vi-v">v{x.v}</b>
                <span className={"vi-kind " + (x.major ? "k-major" : "k-minor")}>{x.major ? "주요" : "세부"}</span>
                <span className="vi-title">{x.title || <span className="vi-auto">{x.auto}</span>}</span>
                <span className="vi-date">{fmtDate(x.date)}</span>
              </button>
              {on && (
                <div className="vi-body">
                  <Blocks blocks={x.blocks} />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
