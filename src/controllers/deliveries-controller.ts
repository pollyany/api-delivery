import { Request, Response } from 'express';

class DeliveriesController {
    create(request: Request, response: Response) {
        return response.json({ message: 'Delivery created successfully' });
    }
}

export { DeliveriesController };