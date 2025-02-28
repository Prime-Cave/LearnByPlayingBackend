const sdk = require("node-appwrite");

const client = new sdk.Client();

client
  .setEndpoint(process.env.APIENDPOINT)
  .setProject(process.env.PROJECT_ID) // Replace with your actual project ID
  .setKey(process.env.APIKEY); // Replace with your actual API key
  const databases = new sdk.Databases(client);

let forLearners; 
let learnersCollection;
let gamesCollection;

async function prepareDatabase() {
    forLearners = await databases.create(
        sdk.ID.unique(),
        'ForLearners'
    );
    learnersCollection = await databases.createCollection(
        forLearners.$id,
        sdk.ID.unique(),
        'LearnersCollection'
    )
    await databases.createStringAttribute(
        forLearners.$id,
        learnersCollection.$id,
        'firstName',
        150,
        true
    )
    await databases.createStringAttribute(
        forLearners.$id,
        learnersCollection.$id,
        'lastName',
        150,
        true
    )
    await databases.createEmailAttribute(
        forLearners.$id,
        learnersCollection.$id,
        'Email', // key
        true, // required
    );
    await databases.createEnumAttribute(
        forLearners.$id,
        learnersCollection.$id,
        'learnerType', // key
        [], // elements
        false, // required
    );
    await databases.createStringAttribute(
        forLearners.$id,
        learnersCollection.$id,
        'password',
        255,
        false
    )
    //The Game Collection
    gamesCollection = await databases.createCollection(
        forLearners.$id,
        sdk.ID.unique(),
        'GamesCollection'
    )
    await databases.createStringAttribute(
        forLearners.$id,
        gamesCollection.$id,
        'gameId',
        255,
        true
    )
    await databases.createStringAttribute(
        forLearners.$id,
        gamesCollection.$id,
        'subject',
        255,
        true
    )
    await databases.createStringAttribute(
        forLearners.$id,
        gamesCollection.$id,
        'gameType',
        10,
        true
    )
}