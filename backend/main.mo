import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Int64 "mo:core/Int64";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

actor {
  // Types

  type Location = { lat : Float; lng : Float; city : Text };

  type Icebreaker = { prompt : Text; answer : Text };

  type UserProfile = {
    principal : Principal;
    name : Text;
    birthday : Int;
    bio : Text;
    gender : Text;
    genderPreference : [Text];
    interests : [Text];
    location : ?Location;
    photos : [Storage.ExternalBlob];
    icebreakers : [Icebreaker];
    isVerified : Bool;
    createdAt : Int;
  };

  type Message = {
    id : Nat;
    fromPrincipal : Principal;
    toPrincipal : Principal;
    text : Text;
    sentAt : Int;
    readAt : ?Int;
  };

  type ConversationSummary = {
    withPrincipal : Principal;
    profile : UserProfile;
    lastMessage : ?Message;
    unreadCount : Nat;
  };

  type QuizAnswers = {
    answers : [Nat]; // one answer index (0-3) per question
    updatedAt : Int;
  };

  type UserPreferences = {
    ageMin : Nat;
    ageMax : Nat;
    incognito : Bool;
    radiusKm : Nat;
    notifyMatches : Bool;
    notifyMessages : Bool;
    notifyLikes : Bool;
  };

  type Report = {
    reporter : Principal;
    target : Principal;
    reason : Text;
    timestamp : Int;
  };

  type DiscoveryProfile = {
    profile : UserProfile;
    distanceKm : ?Float;
    likedMe : Bool;
  };

  type LikeEntry = {
    profile : UserProfile;
    isMatched : Bool;
  };

  // State

  var userProfiles : Map.Map<Principal, UserProfile> = Map.empty();
  var userSwipes : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  var userMatches : Map.Map<Principal, Map.Map<Principal, Int>> = Map.empty();
  var conversations : Map.Map<Text, Map.Map<Nat, Message>> = Map.empty();
  var nextMessageId : Nat = 0;
  var userQuizAnswers : Map.Map<Principal, QuizAnswers> = Map.empty();
  var userPreferences : Map.Map<Principal, UserPreferences> = Map.empty();
  var userBlocks : Map.Map<Principal, Map.Map<Principal, Bool>> = Map.empty();
  var userReports : [Report] = [];
  var userReportCounts : Map.Map<Principal, Nat> = Map.empty();
  var flaggedUsers : Map.Map<Principal, Bool> = Map.empty();

  // Constants

  let MAX_REPORTS_BEFORE_FLAG = 5;
  let MAX_NAME_LEN = 15;
  let MAX_BIO_LEN = 500;
  let MAX_INTERESTS = 10;
  let MAX_ICEBREAKERS = 3;
  let MAX_AGE = 120;
  let MIN_AGE = 18;
  let MAX_DISCOVERY = 50;
  let MAX_MESSAGE_LEN = 2000;
  let QUIZ_QUESTION_COUNT = 10;
  let DEFAULT_PREFS : UserPreferences = {
    ageMin = 18;
    ageMax = 99;
    incognito = false;
    radiusKm = 50;
    notifyMatches = true;
    notifyMessages = true;
    notifyLikes = true;
  };

  // Helpers

  func calculateAge(birthday : Int) : Nat {
    let now = Time.now();
    let diffNano = now - birthday;
    if (diffNano < 0) { 0 } else {
      let seconds = diffNano / 1_000_000_000;
      let years = seconds / (365 * 24 * 3600);
      Int.abs(years);
    };
  };

  func natToFloat(n : Nat) : Float {
    Float.fromInt64(Int64.fromNat64(Nat64.fromNat(n)));
  };

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func validateText(value : Text, maxLen : Nat, fieldName : Text) {
    if (value == "") {
      Runtime.trap(fieldName # " cannot be empty");
    };
    if (value.size() > maxLen) {
      Runtime.trap(fieldName # " must be " # maxLen.toText() # " characters or fewer");
    };
  };

  func getUserSwipes(u : Principal) : Map.Map<Principal, Bool> {
    switch (userSwipes.get(u)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Bool>();
        userSwipes.add(u, m);
        m;
      };
    };
  };

  func getUserMatches(u : Principal) : Map.Map<Principal, Int> {
    switch (userMatches.get(u)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Int>();
        userMatches.add(u, m);
        m;
      };
    };
  };

  func isMatched(a : Principal, b : Principal) : Bool {
    switch (userMatches.get(a)) {
      case (null) { false };
      case (?m) { m.get(b) != null };
    };
  };

  // Canonical conversation key: sorted principal texts joined by ":"
  func convoKey(a : Principal, b : Principal) : Text {
    let aText = a.toText();
    let bText = b.toText();
    if (aText < bText) { aText # ":" # bText } else { bText # ":" # aText };
  };

  func haversineKm(lat1 : Float, lng1 : Float, lat2 : Float, lng2 : Float) : Float {
    let r = 6371.0; // Earth radius in km
    let dLat = (lat2 - lat1) * Float.pi / 180.0;
    let dLng = (lng2 - lng1) * Float.pi / 180.0;
    let a = Float.sin(dLat / 2.0) * Float.sin(dLat / 2.0) +
    Float.cos(lat1 * Float.pi / 180.0) * Float.cos(lat2 * Float.pi / 180.0) * Float.sin(dLng / 2.0) * Float.sin(dLng / 2.0);
    let c = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    r * c;
  };

  func getConvoMap(key : Text) : Map.Map<Nat, Message> {
    switch (conversations.get(key)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Message>();
        conversations.add(key, m);
        m;
      };
    };
  };

  func getUserPrefs(u : Principal) : UserPreferences {
    switch (userPreferences.get(u)) {
      case (?p) { p };
      case (null) { DEFAULT_PREFS };
    };
  };

  func getUserBlocks(u : Principal) : Map.Map<Principal, Bool> {
    switch (userBlocks.get(u)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, Bool>();
        userBlocks.add(u, m);
        m;
      };
    };
  };

  func containsText(arr : [Text], val : Text) : Bool {
    for (t in arr.vals()) {
      if (t == val) { return true };
    };
    false;
  };

  func isBlocked(a : Principal, b : Principal) : Bool {
    let aBlockedB = switch (userBlocks.get(a)) {
      case (?m) { m.get(b) != null };
      case (null) { false };
    };
    if (aBlockedB) {
      true;
    } else {
      switch (userBlocks.get(b)) {
        case (?m) { m.get(a) != null };
        case (null) { false };
      };
    };
  };

  // Endpoints — Profile

  public shared ({ caller }) func setProfile(
    name : Text,
    birthday : Int,
    bio : Text,
    gender : Text,
    genderPreference : [Text],
    interests : [Text],
    location : ?Location,
    icebreakers : [Icebreaker],
    photos : [Storage.ExternalBlob],
  ) : async () {
    requireAuth(caller);
    validateText(name, MAX_NAME_LEN, "Name");
    validateText(bio, MAX_BIO_LEN, "Bio");
    let age = calculateAge(birthday);
    if (age < MIN_AGE or age > MAX_AGE) {
      Runtime.trap("Age must be between 18 and 120");
    };
    if (gender != "" and gender != "male" and gender != "female" and gender != "other") {
      Runtime.trap("Gender must be male, female, or other");
    };
    for (g in genderPreference.vals()) {
      if (g != "male" and g != "female" and g != "other") {
        Runtime.trap("Invalid gender preference value");
      };
    };
    if (interests.size() < 3) {
      Runtime.trap("Select at least 3 interests");
    };
    if (interests.size() > MAX_INTERESTS) {
      Runtime.trap("Too many interests");
    };
    if (icebreakers.size() > MAX_ICEBREAKERS) {
      Runtime.trap("Too many icebreakers");
    };
    for (ib in icebreakers.vals()) {
      validateText(ib.prompt, 200, "Icebreaker prompt");
      validateText(ib.answer, 500, "Icebreaker answer");
    };

    let isComplete = photos.size() >= 2 and bio.size() >= 20 and interests.size() >= 3 and location != null and icebreakers.size() >= 1 and userQuizAnswers.get(caller) != null;

    let createdAt = switch (userProfiles.get(caller)) {
      case (?existing) { existing.createdAt };
      case (null) { Time.now() };
    };
    userProfiles.add(
      caller,
      {
        principal = caller;
        name;
        birthday;
        bio;
        gender;
        genderPreference;
        interests;
        location;
        photos;
        icebreakers;
        isVerified = isComplete;
        createdAt;
      },
    );
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getPublicProfile(target : Principal) : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(target);
  };

  public shared ({ caller }) func deleteProfile() : async () {
    requireAuth(caller);
    userProfiles.remove(caller);
    userSwipes.remove(caller);
    userMatches.remove(caller);
    userPreferences.remove(caller);
    userBlocks.remove(caller);
    userQuizAnswers.remove(caller);
    for ((_, matchMap) in userMatches.entries()) {
      matchMap.remove(caller);
    };
    for ((_, blockMap) in userBlocks.entries()) {
      blockMap.remove(caller);
    };
  };

  // Endpoints — Discovery & Swipe

  public shared ({ caller }) func swipe(target : Principal, action : Text) : async Bool {
    requireAuth(caller);
    if (caller == target) {
      Runtime.trap("Cannot swipe on yourself");
    };
    if (action != "like" and action != "pass") {
      Runtime.trap("Action must be like or pass");
    };
    if (userProfiles.get(target) == null) {
      Runtime.trap("Target profile not found");
    };
    let isLike = action == "like";
    getUserSwipes(caller).add(target, isLike);
    let targetLikedMe = switch (userSwipes.get(target)) {
      case (null) { false };
      case (?targetSwipes) {
        switch (targetSwipes.get(caller)) {
          case (?liked) { liked };
          case (null) { false };
        };
      };
    };
    if (isLike and targetLikedMe) {
      let now = Time.now();
      getUserMatches(caller).add(target, now);
      getUserMatches(target).add(caller, now);
    };
    isLike and targetLikedMe;
  };

  public query ({ caller }) func getDiscovery(limit : Nat) : async [DiscoveryProfile] {
    requireAuth(caller);
    let cap = if (limit > MAX_DISCOVERY) { MAX_DISCOVERY } else { limit };
    let mySwipes = userSwipes.get(caller);
    let myPrefs = getUserPrefs(caller);
    let myCallerProfile = userProfiles.get(caller);
    let myLocation = switch (myCallerProfile) {
      case (?p) { p.location };
      case (null) { null };
    };
    let myGender = switch (myCallerProfile) {
      case (?p) { p.gender };
      case (null) { "" };
    };
    let myGenderPref = switch (myCallerProfile) {
      case (?p) { p.genderPreference };
      case (null) { [] };
    };

    let matches = userProfiles.entries().filterMap(
      func((p, profile)) {
        if (p == caller) {
          null;
        } else {
          let alreadySwiped = switch (mySwipes) {
            case (null) { false };
            case (?swipes) { swipes.get(p) != null };
          };
          let blocked = isBlocked(caller, p);
          let age = calculateAge(profile.birthday);
          let ageOk = age >= myPrefs.ageMin and age <= myPrefs.ageMax;

          let distCalc = switch (myLocation) {
            case (null) { null };
            case (?myLoc) {
              switch (profile.location) {
                case (null) { null };
                case (?theirLoc) {
                  ?haversineKm(myLoc.lat, myLoc.lng, theirLoc.lat, theirLoc.lng);
                };
              };
            };
          };

          let distanceOk = switch (distCalc) {
            case (null) { true }; // show if we can't calculate
            case (?d) { d <= natToFloat(myPrefs.radiusKm) };
          };

          let targetPrefs = switch (userPreferences.get(p)) {
            case (?prefs) { prefs };
            case (null) { DEFAULT_PREFS };
          };

          let likedMe = switch (userSwipes.get(p)) {
            case (?swipes) {
              switch (swipes.get(caller)) {
                case (?liked) { liked };
                case (null) { false };
              };
            };
            case (null) { false };
          };

          let visibleToMe = if (targetPrefs.incognito) {
            likedMe;
          } else {
            true;
          };
          let myPrefOk = myGenderPref.size() == 0 or containsText(myGenderPref, profile.gender);
          let theirPrefOk = profile.genderPreference.size() == 0 or containsText(profile.genderPreference, myGender);
          let isFlagged = flaggedUsers.get(p) != null;
          if (not alreadySwiped and not blocked and not isFlagged and ageOk and distanceOk and visibleToMe and myPrefOk and theirPrefOk) {
            ?(
              {
                profile;
                distanceKm = distCalc;
                likedMe;
              } : DiscoveryProfile
            );
          } else {
            null;
          };
        };
      }
    ).toArray();

    // Sort to prioritize profiles with >= 2 photos
    let withPhotos = matches.filter(func(dp) { dp.profile.photos.size() >= 2 });
    let withoutPhotos = matches.filter(func(dp) { dp.profile.photos.size() < 2 });

    let prioritized = Array.tabulate(
      withPhotos.size() + withoutPhotos.size(),
      func(i) {
        if (i < withPhotos.size()) {
          withPhotos[i];
        } else {
          withoutPhotos[i - withPhotos.size()];
        };
      },
    );

    Array.tabulate(
      if (prioritized.size() < cap) { prioritized.size() } else { cap },
      func(i) {
        prioritized[i];
      },
    );
  };

  public query ({ caller }) func getMatchesCount(location : Location, radius : Nat) : async Nat {
    requireAuth(caller);
    let mySwipes = userSwipes.get(caller);
    let myPrefs = getUserPrefs(caller);

    var count : Nat = 0;
    for ((p, profile) in userProfiles.entries()) {
      if (p != caller) {
        let alreadySwiped = switch (mySwipes) {
          case (null) { false };
          case (?swipes) { swipes.get(p) != null };
        };
        let blocked = isBlocked(caller, p);
        let age = calculateAge(profile.birthday);
        let ageOk = age >= myPrefs.ageMin and age <= myPrefs.ageMax;

        let distanceOk = switch (profile.location) {
          case (null) { false };
          case (?theirLoc) {
            let dist = haversineKm(location.lat, location.lng, theirLoc.lat, theirLoc.lng);
            dist <= natToFloat(radius);
          };
        };

        if (not alreadySwiped and not blocked and ageOk and distanceOk) {
          count += 1;
        };
      };
    };
    count;
  };

  public shared ({ caller }) func unmatch(target : Principal) : async () {
    requireAuth(caller);
    switch (userMatches.get(caller)) {
      case (?m) { m.remove(target) };
      case (null) {};
    };
    switch (userMatches.get(target)) {
      case (?m) { m.remove(caller) };
      case (null) {};
    };
  };

  // Endpoints — Messaging

  public shared ({ caller }) func sendMessage(partner : Principal, text : Text) : async Nat {
    requireAuth(caller);
    if (not isMatched(caller, partner)) {
      Runtime.trap("You can only message your matches");
    };
    validateText(text, MAX_MESSAGE_LEN, "Message");
    let id = nextMessageId;
    nextMessageId += 1;
    let msg : Message = {
      id;
      fromPrincipal = caller;
      toPrincipal = partner;
      text;
      sentAt = Time.now();
      readAt = null;
    };
    getConvoMap(convoKey(caller, partner)).add(id, msg);
    id;
  };

  // Returns all messages in a conversation. Frontend sorts by sentAt.
  public query ({ caller }) func getMessages(partner : Principal) : async [Message] {
    requireAuth(caller);
    let key = convoKey(caller, partner);
    switch (conversations.get(key)) {
      case (null) { [] };
      case (?msgs) {
        msgs.entries().map(func((_, msg)) { msg }).toArray();
      };
    };
  };

  public query ({ caller }) func getConversations() : async [ConversationSummary] {
    requireAuth(caller);
    switch (userMatches.get(caller)) {
      case (null) { [] };
      case (?matches) {
        matches.entries().filterMap(
          func((p, _)) {
            switch (userProfiles.get(p)) {
              case (null) { null };
              case (?profile) {
                let key = convoKey(caller, p);
                let (lastMsg, unread) = switch (conversations.get(key)) {
                  case (null) { (null : ?Message, 0 : Nat) };
                  case (?msgs) {
                    var latest : ?Message = null;
                    var unreadCount : Nat = 0;
                    for ((_, msg) in msgs.entries()) {
                      let isNewer = switch (latest) {
                        case (null) { true };
                        case (?l) { msg.sentAt > l.sentAt };
                      };
                      if (isNewer) { latest := ?msg };
                      if (msg.toPrincipal == caller and msg.readAt == null) {
                        unreadCount += 1;
                      };
                    };
                    (latest, unreadCount);
                  };
                };
                ?{
                  withPrincipal = p;
                  profile;
                  lastMessage = lastMsg;
                  unreadCount = unread;
                };
              };
            };
          }
        ).toArray();
      };
    };
  };

  // Endpoints — Compatibility Quiz

  public shared ({ caller }) func setQuizAnswers(answers : [Nat]) : async () {
    requireAuth(caller);
    if (answers.size() != QUIZ_QUESTION_COUNT) {
      Runtime.trap("Must answer all " # QUIZ_QUESTION_COUNT.toText() # " questions");
    };
    for (a in answers.vals()) {
      if (a > 3) {
        Runtime.trap("Each answer must be 0-3");
      };
    };
    userQuizAnswers.add(caller, { answers; updatedAt = Time.now() });
  };

  public query ({ caller }) func getMyQuizAnswers() : async ?QuizAnswers {
    requireAuth(caller);
    userQuizAnswers.get(caller);
  };

  // Returns compatibility score 0-100, or null if either user hasn't answered.
  public query ({ caller }) func getCompatibilityScore(target : Principal) : async ?Nat {
    requireAuth(caller);
    switch (userQuizAnswers.get(caller)) {
      case (null) { null };
      case (?myQuiz) {
        switch (userQuizAnswers.get(target)) {
          case (null) { null };
          case (?theirQuiz) {
            var matches : Nat = 0;
            var i : Nat = 0;
            while (i < QUIZ_QUESTION_COUNT) {
              if (myQuiz.answers[i] == theirQuiz.answers[i]) {
                matches += 1;
              };
              i += 1;
            };
            ?(matches * 100 / QUIZ_QUESTION_COUNT);
          };
        };
      };
    };
  };

  // Returns (questionIndex, answerIndex) of first question where both users picked the same answer.
  public query ({ caller }) func getFirstSharedAnswer(target : Principal) : async ?(Nat, Nat) {
    requireAuth(caller);
    switch (userQuizAnswers.get(caller)) {
      case (null) { null };
      case (?myQuiz) {
        switch (userQuizAnswers.get(target)) {
          case (null) { null };
          case (?theirQuiz) {
            var result : ?(Nat, Nat) = null;
            var found = false;
            var i : Nat = 0;
            while (i < QUIZ_QUESTION_COUNT and not found) {
              if (myQuiz.answers[i] == theirQuiz.answers[i]) {
                result := ?(i, myQuiz.answers[i]);
                found := true;
              };
              i += 1;
            };
            result;
          };
        };
      };
    };
  };

  // Endpoints — Settings & Privacy

  public shared ({ caller }) func setPreferences(prefs : UserPreferences) : async () {
    requireAuth(caller);
    if (prefs.ageMin < MIN_AGE) {
      Runtime.trap("Minimum age cannot be below " # MIN_AGE.toText());
    };
    if (prefs.ageMax > MAX_AGE) {
      Runtime.trap("Maximum age cannot exceed " # MAX_AGE.toText());
    };
    if (prefs.ageMin > prefs.ageMax) {
      Runtime.trap("Minimum age cannot exceed maximum age");
    };
    userPreferences.add(caller, prefs);
  };

  public query ({ caller }) func getPreferences() : async UserPreferences {
    requireAuth(caller);
    getUserPrefs(caller);
  };

  public shared ({ caller }) func blockUser(target : Principal) : async () {
    requireAuth(caller);
    if (caller == target) {
      Runtime.trap("Cannot block yourself");
    };
    getUserBlocks(caller).add(target, true);
    switch (userMatches.get(caller)) {
      case (?m) { m.remove(target) };
      case (null) {};
    };
    switch (userMatches.get(target)) {
      case (?m) { m.remove(caller) };
      case (null) {};
    };
  };

  public shared ({ caller }) func unblockUser(target : Principal) : async () {
    requireAuth(caller);
    switch (userBlocks.get(caller)) {
      case (?m) { m.remove(target) };
      case (null) {};
    };
    // Restore match if both users had mutually liked each other before the block
    let callerLikedTarget = switch (userSwipes.get(caller)) {
      case (?s) {
        switch (s.get(target)) { case (?true) { true }; case (_) { false } };
      };
      case (null) { false };
    };
    let targetLikedCaller = switch (userSwipes.get(target)) {
      case (?s) {
        switch (s.get(caller)) { case (?true) { true }; case (_) { false } };
      };
      case (null) { false };
    };
    if (callerLikedTarget and targetLikedCaller) {
      let now = Time.now();
      getUserMatches(caller).add(target, now);
      getUserMatches(target).add(caller, now);
    };
  };

  public query ({ caller }) func getBlockedUsers() : async [Principal] {
    requireAuth(caller);
    switch (userBlocks.get(caller)) {
      case (null) { [] };
      case (?m) {
        m.entries().map(func((p, _)) { p }).toArray();
      };
    };
  };

  public shared ({ caller }) func reportUser(target : Principal, reason : Text) : async () {
    requireAuth(caller);
    if (caller == target) {
      Runtime.trap("Cannot report yourself");
    };
    let newReport : Report = {
      reporter = caller;
      target;
      reason;
      timestamp = Time.now();
    };
    let oldReports = userReports;
    userReports := Array.tabulate<Report>(
      oldReports.size() + 1,
      func(i) {
        if (i < oldReports.size()) { oldReports[i] } else { newReport };
      },
    );
    // Increment report count and flag if threshold exceeded
    let prevCount = switch (userReportCounts.get(target)) {
      case (?n) { n };
      case (null) { 0 };
    };
    let newCount = prevCount + 1;
    userReportCounts.add(target, newCount);
    if (newCount >= MAX_REPORTS_BEFORE_FLAG) {
      flaggedUsers.add(target, true);
    };
    // Auto-block the reported user
    getUserBlocks(caller).add(target, true);
    switch (userMatches.get(caller)) {
      case (?m) { m.remove(target) };
      case (null) {};
    };
    switch (userMatches.get(target)) {
      case (?m) { m.remove(caller) };
      case (null) {};
    };
  };

  // Endpoints — Likes

  // People who liked me and haven't been passed by me (matched or pending my response).
  public query ({ caller }) func getLikesReceived() : async [LikeEntry] {
    requireAuth(caller);
    let mySwipes = userSwipes.get(caller);
    userSwipes.entries().filterMap(
      func((p, swipeMap)) {
        if (p == caller or isBlocked(caller, p)) {
          null;
        } else {
          switch (swipeMap.get(caller)) {
            case (?true) {
              let iPassed = switch (mySwipes) {
                case (null) { false };
                case (?s) {
                  switch (s.get(p)) {
                    case (?false) { true };
                    case (_) { false };
                  };
                };
              };
              if (iPassed) {
                null;
              } else {
                switch (userProfiles.get(p)) {
                  case (?profile) {
                    ?({ profile; isMatched = isMatched(caller, p) } : LikeEntry);
                  };
                  case (null) { null };
                };
              };
            };
            case (_) { null };
          };
        };
      }
    ).toArray();
  };

  // People I liked, with their match status.
  public query ({ caller }) func getLikesSent() : async [LikeEntry] {
    requireAuth(caller);
    switch (userSwipes.get(caller)) {
      case (null) { [] };
      case (?mySwipes) {
        mySwipes.entries().filterMap(
          func((p, liked)) {
            if (liked and not isBlocked(caller, p)) {
              switch (userProfiles.get(p)) {
                case (?profile) {
                  ?({ profile; isMatched = isMatched(caller, p) } : LikeEntry);
                };
                case (null) { null };
              };
            } else {
              null;
            };
          }
        ).toArray();
      };
    };
  };

  // Mark all messages from `partner` to caller as read.
  public shared ({ caller }) func markRead(partner : Principal) : async () {
    requireAuth(caller);
    let key = convoKey(caller, partner);
    switch (conversations.get(key)) {
      case (null) {};
      case (?msgs) {
        let now = Time.now();
        // Collect updates first to avoid mutating during iteration
        let updates = msgs.entries().filterMap(
          func((id, msg)) {
            if (msg.toPrincipal == caller and msg.readAt == null) {
              ?(id, { msg with readAt = ?now });
            } else {
              null;
            };
          }
        ).toArray();
        for ((id, updated) in updates.vals()) {
          msgs.add(id, updated);
        };
      };
    };
  };
};
