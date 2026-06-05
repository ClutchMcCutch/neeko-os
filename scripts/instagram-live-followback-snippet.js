(() => {
  const config = {
    pageSize: 50,
    delayMs: 350,
    maxPagesPerList: 2000,
    normalPasses: 3,
    searchFallbackDelayMs: 650,
    deepSearchDelayMs: 450,
    maxAutomaticDeepQueries: 350,
    enableDeepRecovery: false,
    reverseVerifyDelayMs: 550,
    maxReverseVerifyChecks: 250,
    enableReverseVerify: false,
  };

  const tag = "IG followback checker";
  const appId = "936619743392459";
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function log(message) {
    console.log(`%c${tag}%c ${message}`, "font-weight:bold;color:#c13584", "color:inherit");
  }

  function normalizeUsername(value) {
    const username = String(value ?? "")
      .trim()
      .replace(/^@/, "")
      .replace(/\/$/, "")
      .toLowerCase();

    return /^[a-z0-9._]{1,30}$/.test(username) ? username : "";
  }

  function makeRankToken() {
    if (crypto?.randomUUID) {
      return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const value = (Math.random() * 16) | 0;
      return (char === "x" ? value : (value & 0x3) | 0x8).toString(16);
    });
  }

  function getTargetUsername() {
    const fromPath = normalizeUsername(location.pathname.split("/").filter(Boolean)[0]);

    if (fromPath) {
      return fromPath;
    }

    return normalizeUsername(prompt("Enter the Instagram username to scan:"));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      return copied;
    }
  }

  async function igGet(path, params = {}) {
    const url = new URL(path, location.origin);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      credentials: "include",
      headers: {
        accept: "application/json",
        "x-ig-app-id": appId,
        "x-requested-with": "XMLHttpRequest",
      },
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Instagram returned non-JSON for ${url.pathname}. You may need to refresh Instagram and log in again.`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Instagram request failed: ${response.status}`);
    }

    if (data.status === "fail") {
      throw new Error(data.message || `Instagram returned status=fail for ${url.pathname}`);
    }

    return data;
  }

  async function getUser(username) {
    const data = await igGet("/api/v1/users/web_profile_info/", { username });
    const user = data?.data?.user;

    if (!user?.id) {
      throw new Error(`Could not find @${username}.`);
    }

    return {
      id: user.id,
      username: normalizeUsername(user.username || username),
      followersCount: user.edge_followed_by?.count ?? null,
      followingCount: user.edge_follow?.count ?? null,
      isPrivate: !!user.is_private,
      followsViewer: !!user.follows_viewer,
      followedByViewer: !!user.followed_by_viewer,
    };
  }

  function addUsers(target, users, source = "") {
    for (const user of users ?? []) {
      const username = normalizeUsername(user.username);

      if (username) {
        const existing = target.get(username);
        target.set(username, {
          id: user.pk || user.id || "",
          fullName: user.full_name || "",
          isPrivate: !!user.is_private,
          isVerified: !!user.is_verified,
          sources: [...new Set([...(existing?.sources ?? []), source].filter(Boolean))],
        });
      }
    }
  }

  async function fetchRelationshipPage(userId, kind, { rankToken, maxId = "", query = "", count = config.pageSize }) {
    return igGet(`/api/v1/friendships/${userId}/${kind}/`, {
      count,
      max_id: maxId,
      query,
      rank_token: rankToken,
      search_surface: "follow_list_page",
    });
  }

  async function paginateRelationshipList(
    userId,
    kind,
    users,
    { expectedCount, query = "", count = config.pageSize, source = "" }
  ) {
    let maxId = "";
    let page = 0;
    const rankToken = makeRankToken();
    const seenCursors = new Set();
    const label = query ? `${kind} search "${query}"` : kind;

    while (page < config.maxPagesPerList) {
      if (window.IG_FOLLOWBACK_STOP) {
        throw new Error("Stopped by window.IG_FOLLOWBACK_STOP.");
      }

      page += 1;

      const data = await fetchRelationshipPage(userId, kind, {
        rankToken,
        maxId,
        query,
        count,
      });

      const before = users.size;
      addUsers(users, data.users, source || label);
      maxId = data.next_max_id || data.next_max_id_str || "";

      log(
        `${label}: ${users.size}${expectedCount ? `/${expectedCount}` : ""}` +
          ` captured from page ${page}${users.size === before ? " (no new users)" : ""}`
      );

      if (expectedCount && users.size >= expectedCount) {
        break;
      }

      if (!maxId || seenCursors.has(maxId)) {
        break;
      }

      seenCursors.add(maxId);
      await sleep(query ? config.searchFallbackDelayMs : config.delayMs);
    }

    if (page >= config.maxPagesPerList) {
      log(`${label}: stopped at safety page limit ${config.maxPagesPerList}`);
    }

    return users;
  }

  async function fillShortListWithSearch(userId, kind, users, expectedCount) {
    if (!expectedCount || users.size >= expectedCount) {
      return users;
    }

    log(`${kind}: normal pagination stopped at ${users.size}/${expectedCount}; starting search fallback.`);

    const queries = [
      ..."abcdefghijklmnopqrstuvwxyz",
      ..."0123456789",
      "_",
      ".",
    ];

    for (const query of queries) {
      if (users.size >= expectedCount) {
        break;
      }

      await paginateRelationshipList(userId, kind, users, {
        expectedCount,
        query,
        count: 50,
        source: `${kind}:search:${query}`,
      });
    }

    return users;
  }

  function getPrefixQueries(users) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789._";
    const capturedPrefixes = [...users.keys()]
      .flatMap((username) => [username.slice(0, 2), username.slice(0, 3)])
      .filter((query) => query.length >= 2);

    const commonPairs = [];

    for (const first of alphabet) {
      for (const second of alphabet) {
        commonPairs.push(`${first}${second}`);
      }
    }

    return [...new Set([...capturedPrefixes, ...commonPairs])];
  }

  async function fillShortListWithDeepSearch(userId, kind, users, expectedCount) {
    if (!expectedCount || users.size >= expectedCount) {
      return users;
    }

    const missing = expectedCount - users.size;
    const allQueries = getPrefixQueries(users);
    const automaticQueries = allQueries.slice(0, config.maxAutomaticDeepQueries);

    log(
      `${kind}: still short by ${missing}; running ${automaticQueries.length} deeper prefix searches. ` +
        "This is slower but catches accounts hidden by ranked search."
    );

    for (const query of automaticQueries) {
      if (users.size >= expectedCount) {
        break;
      }

      await paginateRelationshipList(userId, kind, users, {
        expectedCount,
        query,
        count: 50,
        source: `${kind}:deep:${query}`,
      });

      await sleep(config.deepSearchDelayMs);
    }

    if (users.size < expectedCount) {
      const remainingQueries = allQueries.slice(config.maxAutomaticDeepQueries);
      const shouldContinue = confirm(
        `${kind} is still short: ${users.size}/${expectedCount}.\n\n` +
          `Run exhaustive prefix recovery (${remainingQueries.length} more searches)?\n` +
          "This can take several minutes, but it is the best shot at a complete list."
      );

      if (shouldContinue) {
        for (const query of remainingQueries) {
          if (users.size >= expectedCount) {
            break;
          }

          await paginateRelationshipList(userId, kind, users, {
            expectedCount,
            query,
            count: 50,
            source: `${kind}:exhaustive:${query}`,
          });

          await sleep(config.deepSearchDelayMs);
        }
      }
    }

    return users;
  }

  async function fetchRelationshipList(userId, kind, expectedCount) {
    const users = new Map();

    for (let pass = 1; pass <= config.normalPasses; pass += 1) {
      if (expectedCount && users.size >= expectedCount) {
        break;
      }

      log(`${kind}: starting normal pagination pass ${pass}/${config.normalPasses}`);

      await paginateRelationshipList(userId, kind, users, {
        expectedCount,
        count: config.pageSize,
        source: `${kind}:normal:${pass}`,
      });

      await sleep(config.delayMs);
    }

    await fillShortListWithSearch(userId, kind, users, expectedCount);
    if (config.enableDeepRecovery) {
      await fillShortListWithDeepSearch(userId, kind, users, expectedCount);
    } else if (expectedCount && users.size < expectedCount) {
      log(`${kind}: stopped after standard recovery at ${users.size}/${expectedCount}.`);
    }

    return users;
  }

  async function candidateFollowsProfile(profile, candidateUsername, candidate) {
    if (!candidate?.id) {
      return { verified: false, reason: "missing candidate id" };
    }

    try {
      const data = await fetchRelationshipPage(candidate.id, "following", {
        rankToken: makeRankToken(),
        query: profile.username,
        count: 50,
      });

      const matches = new Map();
      addUsers(matches, data.users, `reverse:${candidateUsername}`);

      return {
        verified: matches.has(profile.username),
        reason: matches.has(profile.username) ? "candidate following search matched target" : "target not returned",
      };
    } catch (error) {
      return {
        verified: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async function reverseVerifyCandidates(profile, followers, following) {
    const candidates = [...following.entries()]
      .filter(([username]) => !followers.has(username))
      .sort(([a], [b]) => a.localeCompare(b));
    const diagnostics = [];

    if (candidates.length === 0) {
      return diagnostics;
    }

    log(
      `reverse verification: checking ${Math.min(candidates.length, config.maxReverseVerifyChecks)}/${candidates.length} report candidates`
    );

    let checked = 0;
    let recovered = 0;

    for (const [username, candidate] of candidates) {
      if (window.IG_FOLLOWBACK_STOP) {
        throw new Error("Stopped by window.IG_FOLLOWBACK_STOP.");
      }

      if (checked >= config.maxReverseVerifyChecks) {
        diagnostics.push({
          username,
          verified: false,
          reason: `reverse verification limit reached at ${config.maxReverseVerifyChecks}`,
        });
        break;
      }

      checked += 1;
      const result = await candidateFollowsProfile(profile, username, candidate);

      diagnostics.push({
        username,
        candidateId: candidate.id,
        ...result,
      });

      if (result.verified) {
        followers.set(username, {
          ...candidate,
          sources: [...new Set([...(candidate.sources ?? []), "reverse-verified"])],
        });
        recovered += 1;
        log(`reverse verification: removed false positive @${username} (${recovered} recovered)`);
      } else if (checked % 10 === 0) {
        log(`reverse verification: checked ${checked}/${candidates.length}, recovered ${recovered}`);
      }

      await sleep(config.reverseVerifyDelayMs);
    }

    log(`reverse verification: checked ${checked}, recovered ${recovered}`);
    return diagnostics;
  }

  function buildReport(profile, followers, following) {
    const notFollowingBack = [...following.keys()]
      .filter((username) => !followers.has(username))
      .sort((a, b) => a.localeCompare(b));

    const warnings = [];

    if (profile.followersCount !== null && followers.size !== profile.followersCount) {
      warnings.push(`followers returned ${followers.size}, profile count shows ${profile.followersCount}`);
    }

    if (profile.followingCount !== null && following.size !== profile.followingCount) {
      warnings.push(`following returned ${following.size}, profile count shows ${profile.followingCount}`);
    }

    if (profile.isPrivate && !profile.followedByViewer) {
      warnings.push("profile is private and may not expose complete relationship lists to this logged-in account");
    }

    return {
      notFollowingBack,
      text: [
        `Instagram followback report for @${profile.username}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        `Followers returned: ${followers.size}${profile.followersCount !== null ? ` / profile count ${profile.followersCount}` : ""}`,
        `Following returned: ${following.size}${profile.followingCount !== null ? ` / profile count ${profile.followingCount}` : ""}`,
        `Not following back: ${notFollowingBack.length}`,
        warnings.length ? "" : null,
        ...warnings.map((warning) => `WARNING: ${warning}`),
        "",
        ...notFollowingBack.map((username) => `@${username}`),
      ]
        .filter((line) => line !== null)
        .join("\n"),
    };
  }

  function serializeUserMap(users) {
    return [...users.entries()]
      .map(([username, data]) => ({
        username,
        ...data,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  function installDiagnostics(profile, followers, following, report, reverseDiagnostics) {
    const diagnostics = {
      generatedAt: new Date().toISOString(),
      profile,
      counts: {
        followersReturned: followers.size,
        followersProfileCount: profile.followersCount,
        followingReturned: following.size,
        followingProfileCount: profile.followingCount,
        notFollowingBack: report.notFollowingBack.length,
      },
      followers: serializeUserMap(followers),
      following: serializeUserMap(following),
      notFollowingBack: report.notFollowingBack,
      reverseDiagnostics,
      report: report.text,
    };

    window.IG_FOLLOWBACK_LAST = diagnostics;
    window.IG_FOLLOWBACK_DOWNLOAD = () => {
      const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ig-followback-${profile.username}-${Date.now()}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    return diagnostics;
  }

  async function main() {
    if (!location.hostname.endsWith("instagram.com")) {
      throw new Error("Run this from instagram.com while logged in.");
    }

    if (window.IG_FOLLOWBACK_RUNNING) {
      throw new Error("Already running. Set window.IG_FOLLOWBACK_STOP = true to stop it.");
    }

    window.IG_FOLLOWBACK_RUNNING = true;
    window.IG_FOLLOWBACK_STOP = false;

    const username = getTargetUsername();

    if (!username) {
      throw new Error("No username provided.");
    }

    log(`Looking up @${username}...`);
    const profile = await getUser(username);
    log(
      `Found @${profile.username}: ${profile.followersCount ?? "?"} followers, ${profile.followingCount ?? "?"} following.`
    );
    log("Using fast mode: 3 pagination passes + broad search fallback. Deep recovery and reverse verification are off.");

    const followers = await fetchRelationshipList(profile.id, "followers", profile.followersCount);
    const following = await fetchRelationshipList(profile.id, "following", profile.followingCount);
    const reverseDiagnostics = config.enableReverseVerify
      ? await reverseVerifyCandidates(profile, followers, following)
      : [];
    const report = buildReport(profile, followers, following);
    installDiagnostics(profile, followers, following, report, reverseDiagnostics);

    console.log(report.text);
    console.table(report.notFollowingBack.map((username) => ({ username: `@${username}` })));
    log("Diagnostics saved to window.IG_FOLLOWBACK_LAST. Run IG_FOLLOWBACK_DOWNLOAD() to download JSON.");

    const copied = await copyText(report.text);
    alert(
      `Done. Found ${report.notFollowingBack.length} accounts that do not follow back.` +
        (copied ? "\n\nThe report was copied to your clipboard." : "\n\nThe report is printed in the console.")
    );
  }

  main()
    .catch((error) => {
      console.error(tag, error);
      alert(`${tag}: ${error.message}`);
    })
    .finally(() => {
      window.IG_FOLLOWBACK_RUNNING = false;
    });
})();
