import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Authorization system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Chat Room type
  public type ChatRoom = {
    id : Nat;
    name : Text;
    topic : Text;
    createdAt : Time.Time;
  };

  // Message type
  public type Message = {
    id : Nat;
    room : Nat;
    text : Text;
    image : ?Text;
    gif : ?Text;
    author : Principal;
    createdAt : Time.Time;
  };

  // User profile type
  public type User = {
    username : Text;
    bio : Text;
    researchInterests : Text;
    avatarColor : Text;
  };

  // All the chat rooms
  let chatRooms = Map.empty<Nat, ChatRoom>();
  var nextRoomId : Nat = 6; // Start after default rooms

  // All messages
  let messages = Map.empty<Nat, Message>();
  var nextMessageId : Nat = 0;

  // User profiles
  let users = Map.empty<Principal, User>();

  // Constants
  let defaultRooms = [
    { name = "Science"; topic = "General science discussions" },
    { name = "History"; topic = "Discussions about history" },
    { name = "Technology"; topic = "Tech trends and news" },
    { name = "Art"; topic = "Art and creativity sharing" },
    { name = "Nature"; topic = "Nature and environment topics" },
    { name = "Space"; topic = "Space exploration and astronomy" },
  ];

  // Helper functions
  func isRoomExists(roomId : Nat) : Bool {
    if (roomId < 6) {
      return true; // Default rooms always exist
    };
    chatRooms.containsKey(roomId);
  };

  // Save a new chat room
  public shared ({ caller }) func addRoom(name : Text, topic : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };
    let id = nextRoomId;
    nextRoomId += 1;
    let room : ChatRoom = {
      id;
      name;
      topic;
      createdAt = Time.now();
    };
    chatRooms.add(id, room);
  };

  // Retrieve room by ID - accessible to all including guests
  public query ({ caller }) func getRoomById(id : Nat) : async ?ChatRoom {
    // Check if it's a default room
    if (id < 6) {
      return ?{
        id;
        name = defaultRooms[id].name;
        topic = defaultRooms[id].topic;
        createdAt = 0;
      };
    };
    chatRooms.get(id);
  };

  // Get all rooms including default ones - accessible to all including guests
  public query ({ caller }) func getAllRooms() : async [ChatRoom] {
    let defaultRoomsList = Array.tabulate<ChatRoom>(
      defaultRooms.size(),
      func(i) {
        {
          id = i;
          name = defaultRooms[i].name;
          topic = defaultRooms[i].topic;
          createdAt = 0;
        };
      },
    );
    let customRooms = chatRooms.values().toArray();
    defaultRoomsList.concat(customRooms);
  };

  // Add a message - only authenticated users
  public shared ({ caller }) func addMessage(roomId : Nat, text : Text, image : ?Text, gif : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can post messages");
    };
    if (not isRoomExists(roomId)) {
      Runtime.trap("Room does not exist");
    };
    let id = nextMessageId;
    nextMessageId += 1;
    let msg : Message = {
      id;
      room = roomId;
      text;
      image;
      gif;
      author = caller;
      createdAt = Time.now();
    };
    messages.add(id, msg);
    id;
  };

  // Get paginated messages for a room - accessible to all including guests
  public query ({ caller }) func getMessages(roomId : Nat, page : Nat, pageSize : Nat) : async [Message] {
    let allMessages = messages.values().toArray();
    let roomMessages = allMessages.filter(func(msg) { msg.room == roomId });

    // Sort by creation time (newest first)
    let sortedMessages = roomMessages.sort(
      func(a, b) {
        if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal };
      }
    );

    // Paginate
    let start = page * pageSize;
    let end = start + pageSize;
    let totalSize = sortedMessages.size();

    if (start >= totalSize) {
      return [];
    };

    let actualEnd = if (end > totalSize) { totalSize } else { end };
    Array.tabulate<Message>(
      actualEnd - start,
      func(i) { sortedMessages[start + i] }
    );
  };

  // Delete a message - only the author can delete their own message
  public shared ({ caller }) func deleteMessage(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    switch (messages.get(id)) {
      case null {
        Runtime.trap("Message not found");
      };
      case (?msg) {
        if (msg.author != caller) {
          Runtime.trap("Unauthorized: Cannot delete message from another author");
        };
        messages.remove(id);
      };
    };
  };

  // Save user profile - only authenticated users
  public shared ({ caller }) func saveCallerUserProfile(username : Text, bio : Text, interests : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let profile : User = {
      username;
      bio;
      researchInterests = interests;
      avatarColor = color;
    };
    users.add(caller, profile);
  };

  // Get profile for the current user - only authenticated users
  public query ({ caller }) func getCallerUserProfile() : async ?User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  // Get profile for another user - only owner or admin
  public query ({ caller }) func getUserProfile(user : Principal) : async ?User {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };
};
