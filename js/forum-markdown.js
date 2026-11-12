(function () {
  "use strict";

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function inline(text) {
    return text
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  function mediaToken(type, label, url) {
    var attr = url.indexOf("asset://") === 0
      ? ' data-asset-key="' + esc(url.slice(8)) + '"'
      : url.indexOf("draft://") === 0
        ? ' data-draft-id="' + esc(url.slice(8)) + '"'
        : "";
    if (!attr) return "";
    if (type === "image") {
      return '<figure class="md-media"><img' + attr + ' alt="' + esc(label || "帖子图片") + '"><figcaption>' + esc(label || "") + "</figcaption></figure>";
    }
    if (type === "video") {
      return '<figure class="md-media"><video' + attr + ' controls playsinline preload="metadata"></video><figcaption>' + esc(label || "") + "</figcaption></figure>";
    }
    return '<figure class="md-media md-audio"><audio' + attr + ' controls preload="metadata"></audio><figcaption>' + esc(label || "") + "</figcaption></figure>";
  }

  function render(source) {
    var raw = String(source || "");
    var tokens = [];
    var stash = function (html) {
      var key = "@@TOKEN" + tokens.length + "@@";
      tokens.push(html);
      return key;
    };
    raw = raw
      .replace(/!\[([^\]]*)\]\((asset|draft):\/\/([^\s)]+)\)/g, function (_, label, scheme, key) {
        return stash(mediaToken("image", label, scheme + "://" + key));
      })
      .replace(/@\[(video|audio)(?::([^\]]*))?\]\((asset|draft):\/\/([^\s)]+)\)/g, function (_, type, label, scheme, key) {
        return stash(mediaToken(type, label || "", scheme + "://" + key));
      });

    var lines = esc(raw).split(/\r?\n/);
    var out = [];
    var code = [];
    var inCode = false;
    var listType = "";

    function closeList() {
      if (!listType) return;
      out.push("</" + listType + ">");
      listType = "";
    }
    function openList(type) {
      if (listType === type) return;
      closeList();
      listType = type;
      out.push("<" + type + ">");
    }

    lines.forEach(function (line) {
      if (/^```/.test(line)) {
        closeList();
        if (inCode) {
          out.push("<pre><code>" + code.join("\n") + "</code></pre>");
          code = [];
        }
        inCode = !inCode;
        return;
      }
      if (inCode) { code.push(line); return; }
      if (/^[-*]\s+/.test(line)) {
        openList("ul");
        out.push("<li>" + inline(line.replace(/^[-*]\s+/, "")) + "</li>");
        return;
      }
      if (/^\d+[.)]\s+/.test(line)) {
        openList("ol");
        out.push("<li>" + inline(line.replace(/^\d+[.)]\s+/, "")) + "</li>");
        return;
      }
      closeList();
      if (!line.trim()) return;
      if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) out.push("<hr>");
      else if (/^###\s+/.test(line)) out.push("<h3>" + inline(line.replace(/^###\s+/, "")) + "</h3>");
      else if (/^##\s+/.test(line)) out.push("<h2>" + inline(line.replace(/^##\s+/, "")) + "</h2>");
      else if (/^#\s+/.test(line)) out.push("<h1>" + inline(line.replace(/^#\s+/, "")) + "</h1>");
      else if (/^&gt;\s?/.test(line)) out.push("<blockquote>" + inline(line.replace(/^&gt;\s?/, "")) + "</blockquote>");
      else if (/^@@TOKEN\d+@@$/.test(line.trim())) out.push(line.trim());
      else out.push("<p>" + inline(line) + "</p>");
    });
    closeList();
    if (inCode) out.push("<pre><code>" + code.join("\n") + "</code></pre>");
    return out.join("\n").replace(/@@TOKEN(\d+)@@/g, function (_, index) {
      return tokens[Number(index)] || "";
    });
  }

  async function hydrate(root, api, drafts) {
    var nodes = root.querySelectorAll("[data-asset-key]");
    for (var i = 0; i < nodes.length; i++) {
      try {
        var blob = await api.getAsset(nodes[i].dataset.assetKey);
        if (blob) nodes[i].src = URL.createObjectURL(blob);
      } catch (_) {}
    }
    root.querySelectorAll("[data-draft-id]").forEach(function (node) {
      var item = drafts && drafts[Number(node.dataset.draftId)];
      if (item) node.src = item.url;
    });
  }

  window.ForumMarkdown = Object.freeze({ render: render, hydrate: hydrate, escape: esc });
}());
