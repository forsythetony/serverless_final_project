import * as AWS from 'aws-sdk'

import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly userIdIndexName = process.env.USER_ID_INDEX,
        private readonly attachmentsBucketPrefix = process.env.ATTACHMENTS_BUCKET_URL_PREFIX
    ) {

    }

    async getAllTodos(): Promise<TodoItem[]> {
        console.log('Getting all todo items')

        const result = await this.docClient.scan({
            TableName: this.todosTable
        }).promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async getAllTodosForUser(userId: string): Promise<TodoItem[]> {
        console.log(`Getting all todos for user with ID ${userId}`)

        const searchParams = {
            TableName: this.todosTable,
            IndexName: this.userIdIndexName,
            KeyConditionExpression: 'userId = :user_id',
            ExpressionAttributeValues: {
                ':user_id': userId
            },
            ScanIndexForward: false
        }

        const result = await this.docClient.query(searchParams).promise()

        return result.Items as TodoItem[]
    }

    async updateTodo(
        id: string, 
        name: string, 
        dueDate: string, 
        done: boolean
    ): Promise<void> {
        
        const updateRequest : DocumentClient.UpdateItemInput = {
            TableName: this.todosTable,
            Key: {
                'todoId' : id
            },
            UpdateExpression : 'set #name_var = :todo_name, done = :done, dueDate = :due_date',
            ExpressionAttributeNames: {
                '#name_var' : 'name'
            },
            ExpressionAttributeValues: {
                ':todo_name' : name,
                ':done' : done,
                ':due_date' : dueDate
            },
            ReturnValues : 'NONE',

        }


        await this.docClient.update(updateRequest).promise()
    }

    async deleteTodo(id: string): Promise<void> {

        const deleteRequest: DocumentClient.DeleteItemInput = {
            TableName: this.todosTable,
            Key: {
                todoId: id
            }
        }

        await this.docClient.delete(deleteRequest).promise()
    }

    async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
        
        console.log(`Creating a todo item with the ID ${todoItem.todoId}`)

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise()

        return todoItem
    }

    async validateUserOwnsTodo(todoId: string, userId: string): Promise<void> {
        
        const queryInput : DocumentClient.QueryInput = {
            TableName: this.todosTable,
            KeyConditionExpression: 'todoId = :id',
            ExpressionAttributeValues: {
                ':id': todoId
            }
        }

        let foundItem = await this.docClient.query(queryInput).promise()

        if (foundItem.Count < 1) {
            throw new Error(`Failed to find a todo with ID ${todoId}`)
        }

        let todo = foundItem.Items[0] as TodoItem

        if (todo.userId !== userId) {
            throw new Error(`User ${userId} does not own todo with ID ${todoId}`)
        }
    }

    async addAttachmentUrl(todoId: string, imageExtension: string = '.jpg'): Promise<void> {

        const updateRequest : DocumentClient.UpdateItemInput = {
            TableName: this.todosTable,
            Key: {
                'todoId' : todoId
            },
            UpdateExpression : 'set attachmentUrl = :attachment_url',
            ExpressionAttributeValues: {
                ':attachment_url' : `${this.attachmentsBucketPrefix}${todoId}${imageExtension}`
            },
            ReturnValues : 'NONE',
        }

        await this.docClient.update(updateRequest).promise()
    }
}

function createDynamoDBClient(): DocumentClient {
    return new AWS.DynamoDB.DocumentClient()
}