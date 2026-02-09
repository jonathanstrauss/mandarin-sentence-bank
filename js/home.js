const container = document.getElementById("groups");

fetch("groups.json")
  .then(res => res.json())
  .then(groups => {
    container.innerHTML = "";

    groups.forEach(group => {
      const div = document.createElement("div");
      div.className = "group-card";

      const title = document.createElement("h2");
      title.textContent = group.title;

      const desc = document.createElement("p");
      desc.textContent = group.description;

      const link = document.createElement("a");
      link.href = `groups/${group.id}/`;
      link.textContent = "Open practice →";

      div.appendChild(title);
      div.appendChild(desc);
      div.appendChild(link);

      container.appendChild(div);
    });
  })
  .catch(() => {
    container.innerHTML = "<p>Could not load groups.</p>";
  });
