import { PaginationDto } from '../tutors/dto/pagination.dto'
import {Inject} from "@nestjs/common";
import { TutorsService } from '../tutors/tutors.service'
import { NanniesService } from '../nannies/nannies.service'

export interface CategoryStrategy {
    getAllSortedPosts(dto: PaginationDto): Promise<any>;
}

export class ForGetPostsFromAllService {

    private readonly services = {
        13: this.tutorsService,
        14: this.nanniesService,
    };


    constructor(
        @Inject(TutorsService) private readonly tutorsService: TutorsService,
        @Inject(NanniesService) private readonly nanniesService: NanniesService,

    ) {}
    async findPostsByCategory(dto: PaginationDto): Promise<any> {

        const service = this.services[dto.category];
        if (!service) {
           // обработать ошибку, т.к. неизвестная категория
        }
        return service.getAllSortedPosts(dto);

        // if(dto.category == 13) {
        //     const result = await this.tutorsService.getAllSortedPosts(dto);
        //     return result
        // }
        // if(dto.category == 14) {
        //     const result = await this.nanniesService.getAllSortedPosts(dto);
        //     return result
        // }
    }
}