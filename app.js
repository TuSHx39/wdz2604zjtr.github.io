(() => {
  "use strict";

  const categories = {
    lecture: "讲座类",
    core: "核心项目",
    small: "小活动",
    required: "必做项目"
  };
  const categoryOrder = Object.keys(categories);
  const categoryShortNames = { lecture: "讲座", core: "核心", small: "小活动", required: "必做" };
  const categoryColors = { lecture: "蓝色", core: "黄色", small: "白色", required: "红色" };
  const activities = categoryOrder.flatMap((category) => window.ACTIVITIES
    .filter((activity) => activity.category === category)
    .map((activity, index) => ({ ...activity, displayNumber: index + 1 })));
  const list = document.querySelector("#activity-list");
  const search = document.querySelector("#activity-search");
  const filters = [...document.querySelectorAll(".filter-button")];
  const dialog = document.querySelector("#activity-dialog");
  const resetButton = document.querySelector("#reset-filters");
  let selectedCategory = "all";
  let lastTrigger = null;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase("zh-CN").replace(/\s+/g, "");
  const icon = (name) => `<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6">${name === "time"
    ? '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>'
    : '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/>'}</svg>`;
  const fact = (label, value, type) => `<div><dt>${icon(type)}${label}</dt><dd>${value
    ? escapeHtml(value)
    : `<span class="pending-mark" aria-label="${label}未定，确认后补充">待确认</span>`}</dd></div>`;
  const categoryLabel = (activity) => `<span class="category-label" data-category="${activity.category}"><span class="color-dot" aria-hidden="true"></span>${categories[activity.category]}</span>`;
  const activityNumber = (activity) => `${categoryShortNames[activity.category]} ${String(activity.displayNumber).padStart(2, "0")}`;

  const renderCard = (activity) => `<article class="activity-card" data-category="${activity.category}">
    <div class="card-top">${categoryLabel(activity)}<span class="activity-number">${activityNumber(activity)}</span></div>
    <h3>${escapeHtml(activity.title)}</h3>
    <p class="activity-summary">${escapeHtml(activity.summary)}</p>
    <dl class="activity-facts">${fact("时间", activity.time, "time")}${fact("地点", activity.location, "location")}</dl>
    <div class="card-bottom"><span class="flow-preview">${activity.steps.length ? `${activity.steps.length} 个活动环节` : "流程待补充"}</span><button class="detail-button" data-id="${escapeHtml(activity.id)}" aria-label="查看活动：${escapeHtml(activity.title)}">查看活动 <span aria-hidden="true">↗</span></button></div>
  </article>`;

  function renderActivities() {
    const query = normalize(search.value);
    const matches = activities.filter((activity) => {
      const matchesCategory = selectedCategory === "all" || activity.category === selectedCategory;
      const text = [activity.title, activity.summary, activity.location, ...activity.steps].join(" ");
      return matchesCategory && normalize(text).includes(query);
    });
    list.innerHTML = categoryOrder.map((category) => {
      const group = matches.filter((activity) => activity.category === category);
      if (!group.length) return "";
      return `<section class="activity-group" data-category="${category}" aria-labelledby="group-${category}">
        <div class="activity-group-heading"><h3 id="group-${category}">${categories[category]}<span class="group-count">${group.length} 项</span></h3><span>${categoryColors[category]}</span></div>
        <div class="activity-list">${group.map(renderCard).join("")}</div>
      </section>`;
    }).join("");

    document.querySelector("#empty-state").hidden = matches.length > 0;
    document.querySelector("#results-count").textContent = `${selectedCategory === "all" ? "全部活动" : categories[selectedCategory]} · ${matches.length} 项${query ? "搜索结果" : "活动"}`;
    resetButton.hidden = selectedCategory === "all" && search.value.length === 0;
    filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.category === selectedCategory)));
  }

  function openActivity(activity, trigger) {
    lastTrigger = trigger;
    dialog.dataset.category = activity.category;
    document.querySelector("#dialog-category").innerHTML = `${categoryLabel(activity)}<span class="activity-number">${activityNumber(activity)}</span>`;
    document.querySelector("#dialog-title").textContent = activity.title;
    document.querySelector("#dialog-summary").textContent = activity.summary;
    document.querySelector("#dialog-facts").innerHTML = fact("活动时间", activity.time, "time") + fact("活动地点", activity.location, "location");
    document.querySelector("#dialog-steps").innerHTML = activity.steps.map((step, index) => `<li><span class="step-num">${index + 1}</span><div><p>${escapeHtml(step)}</p></div></li>`).join("");
    document.querySelector("#dialog-flow-pending").hidden = activity.steps.length > 0;

    document.body.classList.add("dialog-open");
    dialog.showModal();
    dialog.scrollTop = 0;
  }

  function resetFilters() {
    selectedCategory = "all";
    search.value = "";
    renderActivities();
    filters[0].focus({ preventScroll: true });
  }

  filters.forEach((button) => {
    const category = button.dataset.category;
    const count = category === "all" ? activities.length : activities.filter((activity) => activity.category === category).length;
    button.querySelector(".filter-count").textContent = count;
    button.addEventListener("click", () => {
      selectedCategory = category;
      renderActivities();
    });
  });
  search.addEventListener("input", renderActivities);
  resetButton.addEventListener("click", resetFilters);
  document.querySelector("#empty-reset").addEventListener("click", resetFilters);
  list.addEventListener("click", (event) => {
    const trigger = event.target.closest(".detail-button");
    if (!trigger) return;
    const activity = activities.find((item) => String(item.id) === trigger.dataset.id);
    if (activity) openActivity(activity, trigger);
  });
  ["#dialog-close", "#dialog-done"].forEach((selector) => document.querySelector(selector).addEventListener("click", () => dialog.close()));
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    if (lastTrigger && lastTrigger.getClientRects().length) lastTrigger.focus({ preventScroll: true });
  });

  function renderView(moveFocus = false) {
    const exploring = window.location.hash === "#activities";
    if (dialog.open) dialog.close();
    document.querySelector("#home-view").hidden = exploring;
    document.querySelector("#activities").hidden = !exploring;
    document.body.dataset.view = exploring ? "activities" : "home";
    document.querySelectorAll(".header-nav a").forEach((link) => {
      if (link.hash === (exploring ? "#activities" : "#top")) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (exploring) renderActivities();
    window.scrollTo({ top: 0, behavior: "instant" });
    if (moveFocus) document.querySelector(exploring ? "#activities-heading" : "#hero-title").focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", () => renderView(true));
  document.querySelector("#hero-total").textContent = activities.length;
  document.querySelector("#activity-total").textContent = activities.length;
  renderView();
})();
