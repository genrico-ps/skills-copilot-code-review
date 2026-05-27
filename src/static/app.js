document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const announcementsButton = document.getElementById("announcements-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcement elements
  const announcementBanner = document.getElementById("announcement-banner");
  const announcementBannerTitle = document.getElementById("announcement-banner-title");
  const announcementBannerMessage = document.getElementById("announcement-banner-message");
  const announcementBannerMeta = document.getElementById("announcement-banner-meta");
  const announcementModal = document.getElementById("announcement-modal");
  const announcementList = document.getElementById("announcement-list");
  const announcementForm = document.getElementById("announcement-form");
  const announcementFormTitle = document.getElementById("announcement-form-title");
  const announcementIdInput = document.getElementById("announcement-id");
  const announcementTitleInput = document.getElementById("announcement-title");
  const announcementMessageInput = document.getElementById("announcement-message");
  const announcementStartDateInput = document.getElementById("announcement-start-date");
  const announcementExpiryDateInput = document.getElementById("announcement-expiry-date");
  const closeAnnouncementModal = document.querySelector(".close-announcement-modal");
  const newAnnouncementButton = document.getElementById("new-announcement-button");
  const clearAnnouncementFormButton = document.getElementById("clear-announcement-form");

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Esportes", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Artes", color: "#f3e5f5", textColor: "#7b1fa2" },
    academic: { label: "Acadêmico", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Comunidade", color: "#fff3e0", textColor: "#e65100" },
    technology: { label: "Tecnologia", color: "#e8eaf6", textColor: "#3949ab" },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";

  // Authentication state
  let currentUser = null;

  // Announcement state
  let allAnnouncements = [];

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" }, // Antes das aulas
    afternoon: { start: "15:00", end: "18:00" }, // Após as aulas
    weekend: { days: ["Saturday", "Sunday"] }, // Final de semana
  };

  const announcementStatusLabels = {
    active: "Ativo",
    upcoming: "Programado",
    expired: "Expirado",
  };

  // Initialize filters from active elements
  function initializeFilters() {
    // Initialize day filter
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    // Initialize time filter
    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  // Function to set day filter
  function setDayFilter(day) {
    currentDay = day;

    // Update active class
    dayFilters.forEach((btn) => {
      if (btn.dataset.day === day) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Function to set time range filter
  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;

    // Update active class
    timeFilters.forEach((btn) => {
      if (btn.dataset.time === timeRange) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    fetchActivities();
  }

  // Check if user is already logged in (from localStorage)
  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        // Verify the stored user with the server
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout(); // Clear invalid data
      }
    }

    // Set authentication class on body
    updateAuthBodyClass();
  }

  // Validate user session with the server
  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        // Session invalid, log out
        logout();
        return;
      }

      // Session is valid, update user data
      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  // Update UI based on authentication state
  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
      announcementsButton.classList.remove("hidden");
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
      announcementsButton.classList.add("hidden");
    }

    updateAuthBodyClass();
    // Refresh the activities to update the UI
    fetchActivities();
  }

  // Update body class for CSS targeting
  function updateAuthBodyClass() {
    if (currentUser) {
      document.body.classList.remove("not-authenticated");
    } else {
      document.body.classList.add("not-authenticated");
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getTodayIsoDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function isAnnouncementActive(announcement) {
    const today = getTodayIsoDate();
    const startDate = announcement.start_date || "";
    const expiryDate = announcement.expiry_date || "";

    return (!startDate || startDate <= today) && expiryDate >= today;
  }

  function getAnnouncementStatus(announcement) {
    const today = getTodayIsoDate();
    const startDate = announcement.start_date || "";
    const expiryDate = announcement.expiry_date || "";

    if (expiryDate && expiryDate < today) {
      return "expired";
    }

    if (startDate && startDate > today) {
      return "upcoming";
    }

    return "active";
  }

  function formatAnnouncementDate(dateValue) {
    if (!dateValue) {
      return "Imediata";
    }

    const [year, month, day] = dateValue.split("-").map((part) => parseInt(part, 10));
    const formattedDate = new Date(year, month - 1, day);

    return formattedDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusLabel(status) {
    return announcementStatusLabels[status] || status;
  }

  function resetAnnouncementForm() {
    announcementIdInput.value = "";
    announcementForm.reset();
    announcementFormTitle.textContent = "Novo anúncio";
  }

  function fillAnnouncementForm(announcement) {
    announcementIdInput.value = announcement.id;
    announcementTitleInput.value = announcement.title;
    announcementMessageInput.value = announcement.message;
    announcementStartDateInput.value = announcement.start_date || "";
    announcementExpiryDateInput.value = announcement.expiry_date || "";
    announcementFormTitle.textContent = "Editar anúncio";
  }

  function renderAnnouncementBanner() {
    if (!announcementBanner || !announcementBannerTitle || !announcementBannerMessage || !announcementBannerMeta) {
      return;
    }

    if (!allAnnouncements.length) {
      announcementBannerTitle.textContent = "Nenhum anúncio disponível";
      announcementBannerMessage.textContent = "Quando houver comunicados, eles aparecerão aqui.";
      announcementBannerMeta.innerHTML = "";
      return;
    }

    const activeAnnouncements = allAnnouncements.filter(isAnnouncementActive);
    const sortByUrgency = (left, right) => (left.expiry_date || "9999-12-31").localeCompare(right.expiry_date || "9999-12-31");
    const sortByStart = (left, right) => (left.start_date || "9999-12-31").localeCompare(right.start_date || "9999-12-31");
    const selectedAnnouncement =
      activeAnnouncements.sort(sortByUrgency)[0] ||
      [...allAnnouncements].filter((announcement) => getAnnouncementStatus(announcement) === "upcoming").sort(sortByStart)[0] ||
      [...allAnnouncements].sort(sortByUrgency)[0];

    const status = getAnnouncementStatus(selectedAnnouncement);

    announcementBannerTitle.textContent = selectedAnnouncement.title;
    announcementBannerMessage.textContent = selectedAnnouncement.message;
    announcementBannerMeta.innerHTML = `
      <span class="status-pill ${status}">${getStatusLabel(status)}</span>
      <span class="status-pill">Início: ${formatAnnouncementDate(selectedAnnouncement.start_date)}</span>
      <span class="status-pill">Expira: ${formatAnnouncementDate(selectedAnnouncement.expiry_date)}</span>
      ${activeAnnouncements.length > 1 ? `<span class="status-pill">${activeAnnouncements.length} ativos</span>` : ""}
    `;
  }

  function renderAnnouncementList() {
    if (!announcementList) {
      return;
    }

    if (!allAnnouncements.length) {
      announcementList.innerHTML = `
        <div class="no-results">
          <h4>Nenhum anúncio cadastrado</h4>
          <p>Use o formulário ao lado para criar o primeiro comunicado.</p>
        </div>
      `;
      return;
    }

    announcementList.innerHTML = allAnnouncements
      .map((announcement) => {
        const status = getAnnouncementStatus(announcement);
        return `
          <article class="announcement-list-item is-${status}" data-announcement-id="${escapeHtml(announcement.id)}">
            <div class="announcement-item-header">
              <div>
                <h4>${escapeHtml(announcement.title)}</h4>
                <div class="announcement-item-meta">
                  <span class="status-pill ${status}">${getStatusLabel(status)}</span>
                  <span class="status-pill">Início: ${escapeHtml(formatAnnouncementDate(announcement.start_date))}</span>
                  <span class="status-pill">Expira: ${escapeHtml(formatAnnouncementDate(announcement.expiry_date))}</span>
                </div>
              </div>
            </div>
            <p class="announcement-item-message">${escapeHtml(announcement.message)}</p>
            <div class="announcement-item-actions">
              <button type="button" class="edit-announcement-button" data-announcement-id="${escapeHtml(announcement.id)}">Editar</button>
              <button type="button" class="delete-announcement-button" data-announcement-id="${escapeHtml(announcement.id)}">Excluir</button>
            </div>
          </article>
        `;
      })
      .join("");

    announcementList.querySelectorAll(".edit-announcement-button").forEach((button) => {
      button.addEventListener("click", () => {
        const announcement = allAnnouncements.find((item) => item.id === button.dataset.announcementId);
        if (announcement) {
          fillAnnouncementForm(announcement);
        }
      });
    });

    announcementList.querySelectorAll(".delete-announcement-button").forEach((button) => {
      button.addEventListener("click", () => {
        const announcement = allAnnouncements.find((item) => item.id === button.dataset.announcementId);
        if (!announcement) {
          return;
        }

        showConfirmationDialog(
          `Tem certeza que deseja excluir o anúncio \"${announcement.title}\"?`,
          async () => {
            try {
              const response = await fetch(
                `/announcements/${encodeURIComponent(announcement.id)}?teacher_username=${encodeURIComponent(currentUser.username)}`,
                {
                  method: "DELETE",
                }
              );

              const result = await response.json();

              if (response.ok) {
                showMessage(result.message, "success");
                await fetchAnnouncements();
              } else {
                showMessage(result.detail || "Ocorreu um erro", "error");
              }
            } catch (error) {
              showMessage("Falha ao excluir anúncio. Por favor, tente novamente.", "error");
              console.error("Erro ao excluir anúncio:", error);
            }
          }
        );
      });
    });
  }

  async function fetchAnnouncements() {
    try {
      const response = await fetch("/announcements");
      const announcements = await response.json();

      allAnnouncements = Array.isArray(announcements) ? announcements : [];
      renderAnnouncementBanner();
      renderAnnouncementList();
    } catch (error) {
      console.error("Erro ao buscar anúncios:", error);
      announcementBannerTitle.textContent = "Falha ao carregar anúncios";
      announcementBannerMessage.textContent = "Tente recarregar a página em instantes.";
      announcementBannerMeta.innerHTML = "";
      announcementList.innerHTML = `
        <div class="no-results">
          <h4>Não foi possível carregar os anúncios</h4>
          <p>Verifique a conexão com o servidor e tente novamente.</p>
        </div>
      `;
    }
  }

  function openAnnouncementModal() {
    if (!currentUser) {
      showMessage("Você precisa estar logado como professor para gerenciar anúncios.", "error");
      return;
    }

    announcementModal.classList.remove("hidden");
    announcementModal.classList.add("show");
    renderAnnouncementList();
    resetAnnouncementForm();
  }

  function closeAnnouncementModalHandler() {
    if (!announcementModal) {
      return;
    }

    announcementModal.classList.remove("show");
    setTimeout(() => {
      announcementModal.classList.add("hidden");
      resetAnnouncementForm();
    }, 300);
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    if (!currentUser) {
      showMessage("Você precisa estar logado como professor para gerenciar anúncios.", "error");
      return;
    }

    const payload = {
      title: announcementTitleInput.value.trim(),
      message: announcementMessageInput.value.trim(),
      start_date: announcementStartDateInput.value || null,
      expiry_date: announcementExpiryDateInput.value,
    };

    if (!payload.title || !payload.message || !payload.expiry_date) {
      showMessage("Preencha título, mensagem e data de expiração.", "error");
      return;
    }

    if (payload.start_date && payload.expiry_date < payload.start_date) {
      showMessage("A data de expiração deve ser igual ou posterior à data de início.", "error");
      return;
    }

    const isEditing = Boolean(announcementIdInput.value);
    const endpoint = isEditing
      ? `/announcements/${encodeURIComponent(announcementIdInput.value)}?teacher_username=${encodeURIComponent(currentUser.username)}`
      : `/announcements?teacher_username=${encodeURIComponent(currentUser.username)}`;

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(isEditing ? "Anúncio atualizado com sucesso." : "Anúncio criado com sucesso.", "success");
        resetAnnouncementForm();
        await fetchAnnouncements();
      } else {
        showMessage(result.detail || "Ocorreu um erro", "error");
      }
    } catch (error) {
      showMessage("Falha ao salvar anúncio. Por favor, tente novamente.", "error");
      console.error("Erro ao salvar anúncio:", error);
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(
          data.detail || "Usuário ou senha inválidos",
          "error"
        );
        return false;
      }

      // Login successful
      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Bem-vindo, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Falha no login. Por favor, tente novamente.", "error");
      return false;
    }
  }

  // Logout function
  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    updateAuthUI();
    closeAnnouncementModalHandler();
    showMessage("Você saiu da conta.", "info");
  }

  // Show message in login modal
  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  // Open login modal
  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  // Close login modal
  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  announcementsButton.addEventListener("click", openAnnouncementModal);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);
  closeAnnouncementModal.addEventListener("click", closeAnnouncementModalHandler);
  newAnnouncementButton.addEventListener("click", resetAnnouncementForm);
  clearAnnouncementFormButton.addEventListener("click", resetAnnouncementForm);

  // Close login modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }

    if (event.target === announcementModal) {
      closeAnnouncementModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  announcementForm.addEventListener("submit", saveAnnouncement);

  // Show loading skeletons
  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    // Create more skeleton cards to fill the screen since they're smaller now
    for (let i = 0; i < 9; i++) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  // Format schedule for display - handles both old and new format
  function formatSchedule(details) {
    // If schedule_details is available, use the structured data
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      // Convert 24h time format to 12h AM/PM format for display
      const formatTime = (time24) => {
        const [hours, minutes] = time24.split(":").map((num) => parseInt(num));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        return `${displayHours}:${minutes
          .toString()
          .padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    // Fallback to the string format if schedule_details isn't available
    return details.schedule;
  }

  // Função para determinar o tipo de atividade (idealmente viria do backend)
  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    // Esportes
    if (
      name.includes("futebol") ||
      name.includes("basquete") ||
      name.includes("esporte") ||
      name.includes("fitness") ||
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      desc.includes("time") ||
      desc.includes("jogo") ||
      desc.includes("game") ||
      desc.includes("atlético") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }
    // Artes
    if (
      name.includes("arte") ||
      name.includes("art") ||
      name.includes("música") ||
      name.includes("music") ||
      name.includes("teatro") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("criativo") ||
      desc.includes("creative") ||
      desc.includes("pintura") ||
      desc.includes("paint")
    ) {
      return "arts";
    }
    // Acadêmico
    if (
      name.includes("ciência") ||
      name.includes("science") ||
      name.includes("matemática") ||
      name.includes("math") ||
      name.includes("acadêmico") ||
      name.includes("academic") ||
      name.includes("estudo") ||
      name.includes("study") ||
      name.includes("olimpíada") ||
      name.includes("olympiad") ||
      desc.includes("aprendizagem") ||
      desc.includes("learning") ||
      desc.includes("educação") ||
      desc.includes("education") ||
      desc.includes("competição") ||
      desc.includes("competition")
    ) {
      return "academic";
    }
    // Comunidade
    if (
      name.includes("voluntário") ||
      name.includes("volunteer") ||
      name.includes("comunidade") ||
      name.includes("community") ||
      desc.includes("serviço") ||
      desc.includes("service") ||
      desc.includes("voluntário") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }
    // Tecnologia
    if (
      name.includes("computador") ||
      name.includes("computer") ||
      name.includes("programação") ||
      name.includes("coding") ||
      name.includes("tecnologia") ||
      name.includes("tech") ||
      name.includes("robótica") ||
      name.includes("robotics") ||
      desc.includes("programação") ||
      desc.includes("programming") ||
      desc.includes("tecnologia") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robô") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    // Padrão: acadêmico
    return "academic";
  }

  // Function to fetch activities from API with optional day and time filters
  async function fetchActivities() {
    // Show loading skeletons first
    showLoadingSkeletons();

    try {
      // Build query string with filters if they exist
      let queryParams = [];

      // Handle day filter
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      // Handle time range filter
      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];

        // Handle weekend special case
        if (currentTimeRange === "weekend") {
          // Don't add time parameters for weekend filter
          // Weekend filtering will be handled on the client side
        } else if (range) {
          // Add time parameters for before/after school
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      // Save the activities data
      allActivities = activities;

      // Apply search and filter, and handle weekend filter in client
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Falha ao carregar atividades. Por favor, tente novamente mais tarde.</p>";
      console.error("Erro ao buscar atividades:", error);
    }
  }

  // Function to display filtered activities
  function displayFilteredActivities() {
    // Clear the activities list
    activitiesList.innerHTML = "";

    // Apply client-side filtering - this handles category filter and search, plus weekend filter
    let filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      // Apply category filter
      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      // Apply weekend filter if selected
      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      // Apply search filter
      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (
        searchQuery &&
        !searchableContent.includes(searchQuery.toLowerCase())
      ) {
        return;
      }

      // Activity passed all filters, add to filtered list
      filteredActivities[name] = details;
    });

    // Check if there are any results
    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>Nenhuma atividade encontrada</h4>
          <p>Tente ajustar sua busca ou filtros</p>
        </div>
      `;
      return;
    }

    // Display filtered activities
    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  // Function to render a single activity card
  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    // Calculate spots and capacity
    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    // Determine capacity status class
    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    // Determine activity type
    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];

    // Format the schedule using the new helper function
    const formattedSchedule = formatSchedule(details);

    // Create activity tag
    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    // Create capacity indicator
    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} inscritos</span>
          <span>${spotsLeft} vagas restantes</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Horário:</strong> ${formattedSchedule}
        <span class="tooltip-text">Encontros regulares neste horário durante o semestre</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Participantes atuais:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}">
                  ✖
                  <span class="tooltip-text">Remover este estudante</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Atividade Lotada" : "Registrar Estudante"}
          </button>
        `
            : `
          <div class="auth-notice">
            Apenas professores podem registrar estudantes.
          </div>
        `
        }
      </div>
    `;

    // Add click handlers for delete buttons
    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add click handler for register button (only when authenticated)
    if (currentUser) {
      const registerButton = activityCard.querySelector(".register-button");
      if (!isFull) {
        registerButton.addEventListener("click", () => {
          openRegistrationModal(name);
        });
      }
    }

    activitiesList.appendChild(activityCard);
  }

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current filter and display filtered activities
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current day filter and fetch activities
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active class
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update current time filter and fetch activities
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  // Open registration modal
  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    // Add slight delay to trigger animation
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  // Close registration modal
  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  // Event listener for close button
  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
  });

  // Create and show confirmation dialog
  function showConfirmationDialog(message, confirmCallback) {
    // Create the confirmation dialog if it doesn't exist
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirmar Ação</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="cancel-btn">Cancelar</button>
            <button id="confirm-button" class="confirm-btn">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);

      // Style the buttons
      const cancelBtn = confirmDialog.querySelector("#cancel-button");
      const confirmBtn = confirmDialog.querySelector("#confirm-button");

      cancelBtn.style.backgroundColor = "#f1f1f1";
      cancelBtn.style.color = "#333";

      confirmBtn.style.backgroundColor = "#dc3545";
      confirmBtn.style.color = "white";
    }

    // Set the message
    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    // Show the dialog
    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    // Handle button clicks
    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    // Remove any existing event listeners
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    // Add new event listeners
    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 300);
    });

    // Close when clicking outside
    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 300);
      }
    });
  }

  // Handle unregistration with confirmation
  async function handleUnregister(event) {
    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "Você precisa estar logado como professor para remover estudantes.",
        "error"
      );
      return;
    }

    const activity = event.target.dataset.activity;
    const email = event.target.dataset.email;

    // Show confirmation dialog
    showConfirmationDialog(
      `Tem certeza que deseja remover ${email} da atividade ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            // Refresh the activities list
            fetchActivities();
          } else {
            showMessage(result.detail || "Ocorreu um erro", "error");
          }
        } catch (error) {
          showMessage("Falha ao remover estudante. Por favor, tente novamente.", "error");
          console.error("Erro ao remover estudante:", error);
        }
      }
    );
  }

  // Show message function
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showMessage(
        "Você precisa estar logado como professor para registrar estudantes.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        // Atualiza a lista após registro
        fetchActivities();
      } else {
        showMessage(result.detail || "Ocorreu um erro", "error");
      }
    } catch (error) {
      showMessage("Falha ao registrar estudante. Por favor, tente novamente.", "error");
      console.error("Erro ao registrar estudante:", error);
    }
  });

  // Expose filter functions to window for future UI control
  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Initialize app
  checkAuthentication();
  initializeFilters();
  fetchAnnouncements();
  fetchActivities();
});
