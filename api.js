const db = require("./db");
const { GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");

const getPosts = async (event) => {
  try {
    const { postId } = event.pathParameters;
    const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Key: marshall({ postId }),
  };
  const { Item } = await db.client.send(new GetItemCommand(params));
  console.log(Item);
  return {
    statusCode: 200,
    message: "Post retrieved successfully",
      body: JSON.stringify({ message: "Post retrieved successfully", post: unmarshall(Item) }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      message: "Internal server error",
    };
  }
};

const getAllPosts = async (event) => {  
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const { Items } = await db.client.send(new ScanCommand(params));
    console.log(Items);
    return {
        statusCode: 200,
        body: JSON.stringify({ 
            message: "Posts retrieved successfully", 
            data: Items.map((item) => unmarshall(item)),
            Items 
        }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      message: "Internal server error",
    };
  }
};

const createPost = async (event) => {
  try {
    const { postId, title, content } = JSON.parse(event.body);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall({ postId, title, content }),
    };
    const createdPostResponse = await db.client.send(new PutItemCommand(params));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Post created successfully", 
        createdPostResponse,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      message: "Internal server error",
    };
  }
};

const updatePost = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const objKeys = Object.keys(body);
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId: body.postId }),
      UpdateExpression: `SET ${objKeys.map(key => `${key} = :${key}`).join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce((acc, key, index) => {
        return {
          ...acc,
          [`#key${index}`]: key,
        };  
      }, {}),
      ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => {
        return {
          ...acc,
          [`:value${index}`]: body[key],
        };
      }, {})),
    };
    const updatedPostResponse = await db.client.send(new UpdateItemCommand(params));
    return {
      statusCode: 200,
      message: "Post updated successfully",
      body: JSON.stringify({ message: "Post updated successfully", post: updatedPostResponse }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      message: "Internal server error",
    };
  }
};

const deletePost = async (event) => {
  try {
    const { postId } = event.pathParameters;
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ postId }),
    };
    const deletedPostResponse = await db.client.send(new DeleteItemCommand(params));
    return {
      statusCode: 200,
      message: "Post deleted successfully",
      body: JSON.stringify({ message: "Post deleted successfully", post: deletedPostResponse }),
    };
  } catch (error) {
    console.error(error);
  }
}; 

module.exports = { getPosts, getAllPosts, createPost, updatePost, deletePost };